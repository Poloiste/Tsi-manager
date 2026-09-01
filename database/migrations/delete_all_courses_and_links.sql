-- Migration: delete all course data
-- Supprime tous les liens de cours puis tous les cours

DELETE FROM shared_course_links;
DELETE FROM shared_courses;
