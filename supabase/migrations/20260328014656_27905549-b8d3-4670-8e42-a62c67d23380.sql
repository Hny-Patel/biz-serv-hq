
-- 1. Update handle_new_user to auto-create a company and assign role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  INSERT INTO public.companies (name, owner_id, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.id,
    NEW.email
  )
  RETURNING id INTO new_company_id;

  INSERT INTO public.profiles (user_id, full_name, company_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), new_company_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'company_owner');

  RETURN NEW;
END;
$$;

-- 2. Fix existing users without a company
DO $$
DECLARE
  r RECORD;
  cid uuid;
BEGIN
  FOR r IN
    SELECT p.id AS pid, p.user_id, p.full_name, u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.company_id IS NULL
  LOOP
    INSERT INTO public.companies (name, owner_id, email)
    VALUES (COALESCE(NULLIF(r.full_name,''), split_part(r.email,'@',1)), r.user_id, r.email)
    RETURNING id INTO cid;

    UPDATE public.profiles SET company_id = cid WHERE id = r.pid;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (r.user_id, 'company_owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END;
$$;

-- 3. Create tax_rates table
CREATE TABLE public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their tax rates"
ON public.tax_rates FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company members can manage their tax rates"
ON public.tax_rates FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE TRIGGER update_tax_rates_updated_at
  BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Add discount and attachment columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- 5. Add sort_order to invoice_items
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
