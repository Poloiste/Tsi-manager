-- =========================================
-- Add is_default column to chat_channels
-- Mark default channels (General, Maths, Physics, etc.)
-- =========================================

-- Add is_default column to chat_channels table
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_channels_is_default ON public.chat_channels(is_default) WHERE is_default = true;

-- Mark the common default channels as default
-- These are channels that are automatically created and should not be deletable
UPDATE public.chat_channels 
SET is_default = true 
WHERE name IN ('General', 'Général', 'Maths', 'Mathématiques', 'Physics', 'Physique', 'Chemistry', 'Chimie', 'Biology', 'Biologie', 'Computer Science', 'Informatique', 'History', 'Histoire', 'Geography', 'Géographie')
AND parent_id IS NOT NULL; -- Only mark channels that are in categories, not standalone ones

-- Add comment for documentation
COMMENT ON COLUMN public.chat_channels.is_default IS 
'Indicates if this channel is a default channel that cannot be deleted by users. Default channels are automatically created channels like General, Maths, Physics, etc.';
