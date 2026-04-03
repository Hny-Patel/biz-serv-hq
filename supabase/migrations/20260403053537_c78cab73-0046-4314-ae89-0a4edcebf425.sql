
-- Update handle_new_user to set is_approved = false for self-signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  signup_role text;
BEGIN
  signup_role := COALESCE(NEW.raw_user_meta_data->>'role', 'company_owner');

  IF signup_role IN ('customer', 'vendor') THEN
    -- Customers/vendors don't create their own company
    INSERT INTO public.profiles (user_id, full_name, is_approved, is_active)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), false, true);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, signup_role::app_role);
  ELSE
    -- Company owners create a new company
    INSERT INTO public.companies (name, owner_id, email)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.id,
      NEW.email
    )
    RETURNING id INTO new_company_id;

    INSERT INTO public.profiles (user_id, full_name, company_id, is_approved)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), new_company_id, true);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'company_owner');
  END IF;

  RETURN NEW;
END;
$$;

-- Let customers view services of the company they belong to
CREATE POLICY "Customers can view company services"
ON public.services
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT belongs_to_company_id FROM public.profiles WHERE user_id = auth.uid() AND belongs_to_company_id IS NOT NULL
  )
);

-- Let customers view invoices addressed to them
CREATE POLICY "Customers can view their invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT c.id FROM public.customers c
    JOIN public.profiles p ON p.belongs_to_company_id = c.company_id
    WHERE p.user_id = auth.uid() AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Let vendors view jobs assigned to them
CREATE POLICY "Vendors can view assigned jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());
