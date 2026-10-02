import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

describe('contrato tipográfico do SOLO', () => {
  it('usa Inter na interface e preserva fontes de identidade e dados técnicos', () => {
    expect(indexCss).toContain("--font-sans:  'Inter', system-ui, sans-serif;");
    expect(indexCss).toContain("--font-cyber: 'Orbitron', system-ui, sans-serif;");
    expect(indexCss).toContain("--font-mono:  'Share Tech Mono', monospace;");
    expect(indexCss).toContain('font-family: var(--font-sans);');
  });

  it('carrega somente os pesos necessários das três famílias', () => {
    expect(indexHtml).toContain('family=Inter:wght@400;500;600;700');
    expect(indexHtml).toContain('family=Orbitron:wght@600;700;800;900');
    expect(indexHtml).toContain('family=Share+Tech+Mono');
  });

  it('permite zoom e ampliação de texto no viewport móvel', () => {
    expect(indexHtml).toContain('content="width=device-width, initial-scale=1.0"');
    expect(indexHtml).not.toContain('maximum-scale');
    expect(indexHtml).not.toContain('user-scalable=no');
  });
});
