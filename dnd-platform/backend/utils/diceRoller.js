/**
 * Простой парсер и бросатель кубиков
 * Поддерживает форматы: 1d20, 2d6+3, 1d20+5 advantage, 4d6 drop lowest
 */

function roll(formula) {
  try {
    // Проверяем advantage/disadvantage
    const advantageMatch = formula.match(/(.+)\s+advantage/i);
    const disadvantageMatch = formula.match(/(.+)\s+disadvantage/i);
    
    if (advantageMatch) {
      return rollWithAdvantage(advantageMatch[1], true);
    }
    if (disadvantageMatch) {
      return rollWithAdvantage(disadvantageMatch[1], false);
    }
    
    // Проверяем drop lowest/highest
    const dropMatch = formula.match(/(.+)\s+drop\s+(lowest|highest)/i);
    if (dropMatch) {
      return rollWithDrop(dropMatch[1], dropMatch[2].toLowerCase());
    }
    
    return rollBasic(formula);
  } catch (error) {
    console.error('Dice roll error:', error);
    return {
      formula,
      total: 0,
      rolls: [],
      error: error.message
    };
  }
}

function rollBasic(formula) {
  // Парсим формулу вида "2d6+3"
  const parts = formula.match(/^(\d+)?d(\d+)(?:([+-])(\d+))?$/i);
  
  if (!parts) {
    // Если формула не распознана, бросаем d20
    const roll = Math.floor(Math.random() * 20) + 1;
    return {
      formula,
      total: roll,
      rolls: [roll]
    };
  }
  
  const count = parseInt(parts[1] || '1');
  const sides = parseInt(parts[2]);
  const modifier = parts[3] ? parseInt(parts[3] + parts[4]) : 0;
  
  if (count > 100 || sides > 1000) {
    throw new Error('Too many dice or sides');
  }
  
  const rolls = [];
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  total += modifier;
  
  return {
    formula,
    total,
    rolls,
    modifier: modifier !== 0 ? modifier : undefined
  };
}

function rollWithAdvantage(formula, isAdvantage) {
  const roll1 = rollBasic(formula);
  const roll2 = rollBasic(formula);
  
  const chosen = isAdvantage 
    ? (roll1.total > roll2.total ? roll1 : roll2)
    : (roll1.total < roll2.total ? roll1 : roll2);
  
  return {
    formula: formula + (isAdvantage ? ' advantage' : ' disadvantage'),
    total: chosen.total,
    rolls: chosen.rolls,
    allRolls: [roll1.rolls, roll2.rolls],
    modifier: chosen.modifier
  };
}

function rollWithDrop(formula, dropType) {
  const basic = rollBasic(formula);
  
  if (basic.rolls.length < 2) {
    return basic;
  }
  
  const sortedRolls = [...basic.rolls].sort((a, b) => a - b);
  const dropValue = dropType === 'lowest' ? sortedRolls[0] : sortedRolls[sortedRolls.length - 1];
  
  const dropIndex = basic.rolls.indexOf(dropValue);
  const keptRolls = basic.rolls.filter((_, index) => index !== dropIndex);
  
  const total = keptRolls.reduce((sum, r) => sum + r, 0) + (basic.modifier || 0);
  
  return {
    formula: formula + ` drop ${dropType}`,
    total,
    rolls: keptRolls,
    dropped: dropValue,
    modifier: basic.modifier
  };
}

module.exports = { roll };