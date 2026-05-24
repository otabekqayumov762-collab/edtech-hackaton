import { useApp } from '../store/useApp';
import { Modal, Button } from './ui';
import { Confetti } from './Confetti';
import { Icon } from './Icon';
import { rankTitle } from '../lib/gamification';

export function LevelUpModal() {
  const { levelUp, clearLevelUp } = useApp();
  const open = levelUp !== null;
  return (
    <>
      {open && <Confetti count={36} />}
      <Modal open={open} onClose={clearLevelUp}>
        <div className="rounded-xl border border-ink-700 bg-ink-900 text-center text-white">
          <div className="px-8 pt-10 pb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-brand-600">
              <span className="font-display text-3xl font-bold text-white">
                {levelUp}
              </span>
            </div>
            <h3 className="mt-6 text-2xl font-bold">Yangi daraja</h3>
            <p className="mt-2 text-white/55">
              Siz {levelUp}-levelga ko‘tarildingiz
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm">
              <Icon name="Crown" size={14} className="text-amber-400" />
              {rankTitle(levelUp ?? 1)}
            </div>
          </div>
          <div className="px-8 pb-8">
            <Button size="lg" block onClick={clearLevelUp}>
              Davom etish
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
