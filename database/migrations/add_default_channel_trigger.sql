-- =========================================
-- Default Channel Creation Trigger
-- Automatically creates default channels (General, Maths, Physics) when a category is created
-- =========================================

-- Function to create default channels for new categories
CREATE OR REPLACE FUNCTION create_default_channels_for_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create default channels for categories (not text/voice channels)
  IF NEW.channel_type = 'category' THEN
    -- Create three default text channels
    INSERT INTO public.chat_channels (
      id, 
      name, 
      channel_type, 
      parent_id, 
      visibility,
      created_by,
      created_at
    )
    VALUES 
      (gen_random_uuid(), 'General', 'text', NEW.id, NEW.visibility, NEW.created_by, NOW()),
      (gen_random_uuid(), 'Maths', 'text', NEW.id, NEW.visibility, NEW.created_by, NOW()),
      (gen_random_uuid(), 'Physics', 'text', NEW.id, NEW.visibility, NEW.created_by, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and function if they exist
DROP TRIGGER IF EXISTS create_channel_on_category ON public.chat_channels;
DROP FUNCTION IF EXISTS create_channel_for_category();

-- Create new trigger
CREATE TRIGGER add_default_channels_on_category
AFTER INSERT ON public.chat_channels
FOR EACH ROW
WHEN (NEW.channel_type = 'category')
EXECUTE FUNCTION create_default_channels_for_category();

-- Add comment for documentation
COMMENT ON FUNCTION create_default_channels_for_category() IS 
'Automatically creates three default text channels (General, Maths, Physics) when a new category is created. The channels inherit visibility from the category.';

COMMENT ON TRIGGER add_default_channels_on_category ON public.chat_channels IS 
'Trigger that fires after a category is created to automatically add default channels (General, Maths, Physics).';
