import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { groupByWeekend } from '../src/lib/decision.mjs'
test('raggruppa le gare della stessa settimana', () => { const groups = groupByWeekend([{ date: '2026-10-24' }, { date: '2026-10-25' }, { date: '2026-11-01' }]); assert.equal(groups.length, 2); assert.equal(groups[0].matches.length, 2) })
test('include le 26 gare Matese del girone H', async () => { const source = await readFile(new URL('../src/data/schedule.ts', import.meta.url), 'utf8'); assert.equal((source.match(/\['11\d{3}','202[67]-/g) ?? []).length, 26); assert.match(source, /name: 'FAAM Matese'/); assert.match(source, /status: 'published'/) })
test('mostra sempre una anteprima news anche senza immagine', async () => { const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'); assert.match(source, /className="news-preview"/); assert.match(source, /onError=/) })
test('non propone una partita consigliata', async () => { const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'); assert.doesNotMatch(source, /chooseHomeMatch|CONSIGLIATA|partita consigliata/i); assert.match(source, /senza suggerimenti/i) })
