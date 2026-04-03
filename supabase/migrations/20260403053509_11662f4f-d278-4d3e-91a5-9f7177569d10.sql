
-- Add customer and vendor to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Add approval and company-linking fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS belongs_to_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Allow customers/vendors to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
