/*
 * The Smite macro emulates the Divine Smite feature of Paladins in DnD 5e. A spell slot level to use
 * can be selected, which increases the number of damage dice, and smiting a fiend or undead
 * will also increase the number of damage dice.
 *
 * First, select a token to perform the smite, then target an enemy to be smitten. Make your regular
 * attack and then if you choose to use Divine Smite, run this macro.
 */

//Configurable variables
let maxSpellSlot = 5; //Highest spell-slot level that may be used.
let affectedCreatureTypes = ["fiend", "undead"]; //Creature types that take extra damage.
let allowConsumeSpellSlotChoice = false; //Can the user choose whether to consume the spell slot?
let consumeSpellSlot = true; //Does the macro consume a spell slot?
let allowCriticalHit = true; //Can the user choose whether the dice should be doubled as a critical hit?
let allowConsumepactSlot = true; //Can the user choose to use pact Magic slots, if present?
let macroFlavor = `Macro Divine Smite - Damage Roll (Radiant)`; //Flavor to show in the chat roll.

let dieSize = `d8`; //Die size to use for the SMITE.
//
if (allowCriticalHit) {
  macroFlavor += ` - Critical Hit!`;
}
let optionsText = `<p>Spell Slot level to use Divine Smite with.</p><form>
 <div class="form-group"><label>Spell Slot Level:</label><select id="slot-level" name="slot-level">`;

let s_actor = game.user.character || canvas.tokens.controlled[0]?.actor;

if (s_actor?.data.items.find((i) => i.name === "Divine Smite") === undefined) {
  return ui.notifications.error(
    `No valid actor selected that can use this macro.`
  );
}

//#region Functions
let confirmed = false;
let criticalhit = false;
if (getAvailableSlots(s_actor) || !consumeSpellSlot) {
  for (let i = 1; i < maxSpellSlot; i++) {
    let chosenSpellSlots = getSpellSlots(s_actor, i);
    if (chosenSpellSlots.value > 0 && consumeSpellSlot) {
      optionsText += `<option type="spell" value="${i}">${i} - ${chosenSpellSlots.value} slots available</option>`;
    } else if (!consumeSpellSlot) {
      optionsText += `<option type="spell" value="${i}">${i}</option>`;
    }
  }
  if (getSpellSlots(s_actor, "pact")) {
    optionsText += `<option type="pact" value="pact">Pact Magic level ${actor.data.data.spells.pact.level} - ${actor.data.data.spells.pact.value} slots available</option>`;
  }
  optionsText += `</select></div>`;
  if (allowCriticalHit) {
    optionsText += `<div class="form-group"><label>Critical Hit:</label>
       <input type="checkbox" name="criticalCheckbox" /></div>`;
  }
  if (allowConsumeSpellSlotChoice) {
    optionsText += `<div class="form-group"><label>Consume Spell Slot:</label>
        <input type="checkbox" name="consumeSpellSlot" checked="${consumeSpellSlot}" /></div>`;
  }
  optionsText += `</div></form>`;
  // Create a dialogue box to select spell slot level to use when smiting.
  new Dialog({
    title: "Divine Smite Damage",
    content: optionsText,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "SMITE!",
        callback: () => (confirmed = true),
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => (confirmed = false),
      },
    },
    default: "Cancel",
    close: (html) => {
      if (confirmed) {
        let slotLevel = html.find("[name=slot-level]")[0].value;
        let userConsumeSpellSlot = html.find("[name=consumeSpellSlot]")[0]
          ?.checked;
        let criticalHit = html.find("[name=criticalCheckbox]")[0].checked;
        smite(
          s_actor,
          slotLevel,
          criticalHit,
          consumeSpellSlot || userConsumeSpellSlot
        );
      }
    },
  }).render(true);
} else {
  return ui.notifications.error(
    `No spell slots available to use this feature.`
  );
}
/**
 * Gives the spell slot information for a particular actor and spell slot level.
 * @param {Actor5e} actor - the actor to get slot information from.
 * @param {string} level - the spell slot level to get information about. Can use pact to call Warlock levels.
 * @returns {object} contains value (number of slots remaining), max, and override.
 */
function getSpellSlots(actor, level) {
    if (level == "pact"){
        return actor.data.data.spells.pact.value;
    }
  return actor.data.data.spells[`spell${level}`];
}

/**
 * Gives the spell slots available for
 * @param {Actor5e} actor - the actor to get slot information from.
 * @returns {boolean} True if any spell slots of any spell level are available to be used.
 */
function getAvailableSlots(actor) {
  for (let slot in actor.data.data.spells) {
    if (actor.data.data.spells[slot].value > 0) {
      return true;
    }
  }
  if (allowConsumepactSlot) {
    if (actor.data.data.spells.pact.value > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Use the controlled token to smite the targeted token.
 * @param {Actor5e} actor - the actor that is performing the action.
 * @param {string} slotLevel - the spell slot level to use when smiting.
 * @param {boolean} criticalHit - whether the hit is a critical hit.
 * @param {boolean} consumeSpellSlot - whether to consume the selected spell slot.
 * @param {boolean} bonusDieCreatureType - whether to add an additional die due to creature type.
 */
function smite(actor, slotLevel, criticalHit, consumeSpellSlot,bonusDieCreatureType) {
  let chosenSpellSlots = getSpellSlots(actor, slotLevel);
  let updateValue = `data.spells.spell${slotLevel}.value`;
  if (slotLevel == "pact"){
      slotLevel = actor.data.data.spells.pact.level;
    updateValue = `data.spells.pact.value`;
  }
  let numDice = slotLevel + 1;
    if (criticalHit) numDice *= 2;
    if (bonusDieCreatureType) numDice += 1;
    new Roll(`${numDice}${dieSize}`).roll().toMessage({
      flavor: macroFlavor,
      speaker,
    });
  if (consumeSpellSlot) {
    let objUpdate = new Object();
    objUpdate[updateValue] = chosenSpellSlots - 1;
    actor.update(objUpdate);
  }
}
//#endregion
