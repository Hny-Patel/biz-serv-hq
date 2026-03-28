
-- Create currencies table
CREATE TABLE public.currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their currencies"
  ON public.currencies FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company members can manage their currencies"
  ON public.currencies FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Add terms_and_conditions and currency_id to invoices
ALTER TABLE public.invoices ADD COLUMN terms_and_conditions text;
ALTER TABLE public.invoices ADD COLUMN currency_id uuid REFERENCES public.currencies(id);

-- Add terms_and_conditions and currency_id to proposals
ALTER TABLE public.proposals ADD COLUMN terms_and_conditions text;
ALTER TABLE public.proposals ADD COLUMN currency_id uuid REFERENCES public.currencies(id);

-- Add updated_at trigger for currencies
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
