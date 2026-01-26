-- Fix the RLS policy to allow players to join waiting rooms
-- This replaces the existing update policy

-- First, drop the old policy
DROP POLICY IF EXISTS "Players in the room can update it" ON game_rooms;

-- Create a new policy that allows:
-- 1. Players already in the room to update it
-- 2. Any player to join a waiting room (where player2_id is NULL)
CREATE POLICY "Players can update their rooms or join waiting rooms"
  ON game_rooms FOR UPDATE
  USING (
    -- Allow if you're already player1 or player2
    auth.uid()::text = player1_id::text OR
    auth.uid()::text = player2_id::text OR
    -- OR allow if the room is waiting and has no player2 yet
    (status = 'waiting' AND player2_id IS NULL)
  );
