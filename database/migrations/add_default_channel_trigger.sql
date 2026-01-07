-- =========================================
-- Default Channel Creation Trigger
-- Automatically creates a "General" text channel when a category is created
-- =========================================

-- Function to create a default "General" channel for new categories
CREATE OR REPLACE FUNCTION create_channel_for_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create default channel for categories (not text/voice channels)
  IF NEW.channel_type = 'category' THEN
    INSERT INTO public.chat_channels (
      id, 
      name, 
      channel_type, 
      parent_id, 
      visibility,
      created_by,
      created_at
    )
    VALUES (
      gen_random_uuid(), 
      'General', 
      'text', 
      NEW.id,  -- Set the new category as parent
      NEW.visibility,  -- Inherit visibility from category
      NEW.created_by,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS create_channel_on_category ON public.chat_channels;

CREATE TRIGGER create_channel_on_category
AFTER INSERT ON public.chat_channels
FOR EACH ROW
WHEN (NEW.channel_type = 'category')
EXECUTE FUNCTION create_channel_for_category();

-- Add comment for documentation
COMMENT ON FUNCTION create_channel_for_category() IS 
'Automatically creates a "General" text channel when a new category is created. The channel inherits visibility from the category.';

COMMENT ON TRIGGER create_channel_on_category ON public.chat_channels IS 
'Trigger that fires after a category is created to automatically add a default "General" channel.';
