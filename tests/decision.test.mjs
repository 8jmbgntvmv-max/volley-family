import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseHomeMatch, groupByWeekend } from '../src/lib/decision.mjs'
test('ignora tutte le trasferte', () => assert.equal(chooseHomeMatch([{ team: 'altino', home: false }, { team: 'perugia', home: false }]), null))
test('applica Altino > Matese > Perugia', () => assert.equal(chooseHomeMatch([{ id: 'p', team: 'perugia', home: true }, { id: 'm', team: 'matese', home: true }, { id: 'a', team: 'altino', home: true }]).id, 'a'))
test('sceglie una sola gara e la prima cronologicamente a pari priorità', () => assert.equal(chooseHomeMatch([{ id: 'd', team: 'altino', home: true, date: '2026-10-18' }, { id: 'm', team: 'altino', home: true, date: '2026-10-14' }]).id, 'm'))
test('raggruppa le gare della stessa settimana', () => { const groups = groupByWeekend([{ date: '2026-10-24' }, { date: '2026-10-25' }, { date: '2026-11-01' }]); assert.equal(groups.length, 2); assert.equal(groups[0].matches.length, 2) })
