import { fsrs, State, type Card } from 'ts-fsrs';
import type { CardStateRow } from '../db/queries';

export type FSRSReviewRating = 1 | 2 | 3 | 4;

export type ScheduledCardState = Pick<
  CardStateRow,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsed_days'
  | 'scheduled_days'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'last_review'
>;

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
});

const nowUnix = (): number => Math.floor(Date.now() / 1000);

const clampState = (value: number): State => {
  if (value <= State.New) {
    return State.New;
  }
  if (value >= State.Relearning) {
    return State.Relearning;
  }
  return value as State;
};

const toFsrsCard = (state: CardStateRow): Card => {
  return {
    due: new Date((state.due || nowUnix()) * 1000),
    stability: state.stability || 0,
    difficulty: state.difficulty || 0,
    elapsed_days: state.elapsed_days || 0,
    scheduled_days: state.scheduled_days || 0,
    learning_steps: 0,
    reps: state.reps || 0,
    lapses: state.lapses || 0,
    state: clampState(state.state),
    last_review: state.last_review ? new Date(state.last_review * 1000) : undefined,
  };
};

const toCardStateUpdate = (card: Card): ScheduledCardState => {
  return {
    due: Math.max(Math.floor(card.due.getTime() / 1000), nowUnix()),
    stability: Number.isFinite(card.stability) ? card.stability : 0,
    difficulty: Number.isFinite(card.difficulty) ? card.difficulty : 0,
    elapsed_days: Number.isFinite(card.elapsed_days) ? card.elapsed_days : 0,
    scheduled_days: Number.isFinite(card.scheduled_days) ? card.scheduled_days : 0,
    reps: Number.isFinite(card.reps) ? card.reps : 0,
    lapses: Number.isFinite(card.lapses) ? card.lapses : 0,
    state: clampState(card.state),
    last_review: card.last_review ? Math.floor(card.last_review.getTime() / 1000) : nowUnix(),
  };
};

export function useFSRS() {
  const schedule = (currentState: CardStateRow, rating: FSRSReviewRating): ScheduledCardState => {
    const card = toFsrsCard(currentState);
    const result = scheduler.next(card, new Date(), rating as 1 | 2 | 3 | 4);
    return toCardStateUpdate(result.card);
  };

  return {
    schedule,
  };
}
