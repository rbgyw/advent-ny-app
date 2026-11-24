import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import NinthTaskScreen from '../src/components/NinthTaskScreen.vue';
import TenthTaskScreen from '../src/components/TenthTaskScreen.vue';
import { assignment } from './fixtures';

const stubs = { PopupDialog: { props: ['open'], template: '<div v-if="open" role="dialog"><slot /></div>' } };
const props = { assignment: assignment(), day: 9, total: 25, loading: false, saving: false, error: null, saveError: null };

describe('review 7 games', () => {
  it.each([[10, 46], [11, 45]])('accepts Oleg at %s and Filipp at %s', async (oleg, filipp) => {
    const view = mount(NinthTaskScreen, { props, global: { stubs } });
    await view.findAll('button').find(button => button.text() === 'Начать расследование')!.trigger('click');
    const cells = [6, oleg, 14, 22, 30, 40, filipp];
    for (const [index, cell] of cells.entries()) {
      await view.findAll('.factory-person')[index]!.trigger('click');
      await view.findAll('.factory-cells button')[cell]!.trigger('click');
    }
    await view.findAll('button').find(button => button.text() === 'Проверить версию')!.trigger('click');
    await view.get('input[value="natalya"]').setValue(true);
    await view.get('form').trigger('submit');
    expect(view.emitted('save')).toEqual([[{ response: { solved: true }, complete: true }]]);
  });
  it('moves the chosen wizard opposite the country and keeps the cards unique', async () => {
    const view = mount(TenthTaskScreen, { props: { ...props, day: 15 } });
    await view.findAll('.frost-pairs > div')[1]!.findAll('button')[1]!.trigger('click');
    await view.findAll('.frost-pairs > div')[0]!.findAll('button')[3]!.trigger('click');
    const names = view.findAll('.frost-pairs > div')[1]!.findAll('button').map(button => button.text());
    expect(names[3]).toContain('Сан-Николас');
    expect(new Set(names).size).toBe(4);
  });
});
