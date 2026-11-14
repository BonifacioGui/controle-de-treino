import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workoutCompleteSource = readFileSync(new URL('./WorkoutComplete.jsx', import.meta.url), 'utf8');
const historyViewSource = readFileSync(new URL('../dashboard/HistoryView.jsx', import.meta.url), 'utf8');

describe('fluxos de prévia e exportação do Share Card', () => {
  it('usa o mesmo ShareCard para gerar e exibir a prévia em WorkoutComplete', () => {
    expect(workoutCompleteSource).toContain('<ShareCard cardRef={cardRef}');
    expect(workoutCompleteSource).toContain('photoPosition={photoPosition}');
    expect(workoutCompleteSource).toContain('toBlob(cardRef.current');
    expect(workoutCompleteSource).toContain('setGeneratedImage(url)');
    expect(workoutCompleteSource).toContain('src={generatedImage}');
  });

  it('usa o mesmo ShareCard para gerar e exibir a prévia no histórico', () => {
    expect(historyViewSource).toContain('<ShareCard cardRef={setShareCardNode}');
    expect(historyViewSource).toContain('photoPosition={cardDraft.photoPosition}');
    expect(historyViewSource).toContain('toBlob(shareCardNode');
    expect(historyViewSource).toContain('setCardPreviewUrl(nextPreviewUrl)');
    expect(historyViewSource).toContain('src={cardPreviewUrl}');
  });
});
