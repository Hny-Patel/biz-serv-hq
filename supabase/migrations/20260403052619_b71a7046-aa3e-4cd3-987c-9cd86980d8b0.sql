
-- Add image_url column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their company folder
CREATE POLICY "Users can upload service images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images'
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Allow authenticated users to update their service images
CREATE POLICY "Users can update service images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Allow authenticated users to delete their service images
CREATE POLICY "Users can delete service images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Public read access for service images (needed for shop storefront)
CREATE POLICY "Public can view service images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-images');
