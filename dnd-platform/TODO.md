# TODO для нового чата: Редактор персонажей (полная реализация)

## 🎯 ЦЕЛЬ НОВОГО ЧАТА:
Полностью реализовать редактор персонажей D&D 5e со всеми компонентами

## 📋 ЧТО НУЖНО СДЕЛАТЬ:

### КОМПОНЕНТЫ для реализации:
1. **CharacterSheet.vue** - полный лист персонажа
2. **AbilityScores.vue** - 6 характеристик с интерактивным изменением
3. **AbilityScore.vue** - отдельная характеристика (STR/DEX/CON/INT/WIS/CHA)
4. **SkillsList.vue** - все навыки D&D 5e с расчетом модификаторов
5. **CombatStats.vue** - боевые параметры (HP, AC, инициатива, скорость)
6. **HitPoints.vue** - управление хит-поинтами
7. **Equipment.vue** - снаряжение с Drag&Drop
8. **Spells.vue** - книга заклинаний
9. **PersonalityTraits.vue** - черты личности
10. **Features.vue** - особенности и умения класса
11. **Notes.vue** - заметки

### БАЗА ДАННЫХ (дополнить):
1. **Таблица навыков** - все 18 навыков D&D
2. **Таблица заклинаний** - SRD заклинания
3. **Таблица особенностей классов** - умения по уровням
4. **Таблица расовых бонусов** - особенности рас

### API ENDPOINTS:
1. `GET /api/characters/:id/skills` - навыки персонажа
2. `POST /api/characters/:id/skills` - обновить навыки
3. `GET /api/spells` - заклинания с фильтрами
4. `GET /api/classes/:id/features` - умения класса
5. `GET /api/races/:id/features` - расовые особенности

### ФУНКЦИОНАЛЬНОСТЬ:
1. Автоматический расчет всех модификаторов
2. Drag&Drop для экипировки
3. Фильтрация заклинаний по классу/уровню
4. Импорт/экспорт персонажа в JSON
5. Валидация данных персонажа

## 📁 СТРУКТУРА КОМПОНЕНТОВ:

src/components/character/
├── CharacterSheet.vue (главный компонент)
├── sections/
│ ├── AbilityScores.vue # характеристики
│ ├── SkillsSection.vue # навыки
│ ├── CombatSection.vue # боевые параметры
│ ├── EquipmentSection.vue # снаряжение
│ ├── SpellsSection.vue # заклинания
│ ├── FeaturesSection.vue # умения
│ └── NotesSection.vue # заметки
└── ui/
├── AbilityScoreCard.vue # карточка характеристики
├── SkillItem.vue # элемент навыка
├── SpellCard.vue # карточка заклинания
└── EquipmentItem.vue # элемент снаряжения


## 🎨 ДИЗАЙН-СИСТЕМА:
- Использовать PrimeVue компоненты
- Адаптивная верстка для мобильных
- Темная/светлая тема
- Print-friendly стили для экспорта

## 🧪 ТЕСТИРОВАНИЕ:
1. Unit тесты для расчетов модификаторов
2. E2E тест создания персонажа
3. Тест импорта/экспорта

## ⏱️ ЭТАПЫ РЕАЛИЗАЦИИ:
1. Неделя 1: SkillsList + CombatStats
2. Неделя 2: Equipment + Spells
3. Неделя 3: Features + Notes
4. Неделя 4: Тестирование + оптимизация

## 🔗 ССЫЛКИ:
- D&D 5e SRD: https://dnd.wizards.com/resources/systems-reference-document
- API документация: http://localhost:3000/api-docs
- Figma макет: [ссылка на дизайн]