-- CreateIndex (only indexes not already created)

-- teacher_profile single-column school_id index
CREATE INDEX `teacher_profile_school_id_idx` ON `teacher_profile`(`school_id`);

-- mentoring_visit single-column teacher_id (FK was not renamed, create new)
CREATE INDEX `mentoring_visit_teacher_id_idx` ON `mentoring_visit`(`teacher_id`);

-- plc_activity single-column teacher_id
CREATE INDEX `plc_activity_teacher_id_idx` ON `plc_activity`(`teacher_id`);

-- development_plan single-column teacher_id
CREATE INDEX `development_plan_teacher_id_idx` ON `development_plan`(`teacher_id`);
