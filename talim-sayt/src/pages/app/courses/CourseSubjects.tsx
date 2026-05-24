import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/Icon';
import { PageHead } from '../_shared';
import { APP_SUBJECTS, COURSE_SUBJECTS, type CourseSubject } from '../../../lib/courses';

export function CourseSubjects() {
  const nav = useNavigate();

  return (
    <div>
      <PageHead
        icon="GraduationCap"
        title="Fan tanlang"
        desc="Bir fanga kirib, sinfingiz va bo‘limni tanlang."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-3"
      >
        {COURSE_SUBJECTS.filter(
          (s) =>
            s.available &&
            APP_SUBJECTS.some((a) => a.courseId === s.id),
        ).map((s) => (
          <SubjectCard
            key={s.id}
            subject={s}
            onClick={() => nav(`/app/fan/${s.id}/sinf`)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function SubjectCard({
  subject,
  onClick,
}: {
  subject: CourseSubject;
  onClick: () => void;
}) {
  const { icon, color, name, description } = subject;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded-xl border border-ink-700 bg-ink-800 p-5 text-left transition-all hover-lift hover:border-brand-500"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ background: `${color}26`, color }}
      >
        <Icon name={icon} size={22} />
      </span>
      <h3 className="mt-4 font-bold text-white">{name}</h3>
      <p className="mt-1.5 flex-1 text-sm text-white/50">{description}</p>
      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold">
        <span className="flex items-center gap-1 text-brand-300">
          Boshlash
          <Icon name="ArrowRight" size={14} />
        </span>
      </div>
    </button>
  );
}
