// Macro to enable converting a selected weapon's damage type to Force and adding +xd8 according to level. Requires MQOL.
//Configurable values
const featureName = "Planar Warrior";
const className = "Ranger";
const levelScale = [3, 11];
var dmgArray = ["d8", "force"];
// -------------

//requires about-time, macro-marker, better rolls
let requiredModules = ["minor-qol"];
let optionalModules = [];
let missingModules = [];
requiredModules.forEach(function (module) {
  if (game.modules.get(module)?.active != true) {
    missingModules.push(module);
  }
});
if (missingModules === []) {
  return ui.notifications.error(
    `Required module(s) not found: ${missingModules.join(", ")}`
  );
}
missingModules = [];
optionalModules.forEach(function (module) {
  if (game.modules.get(module)?.active != true) {
    missingModules.push(module);
  }
});
if (missingModules === []) {
  return ui.notifications.console.warn(
    `Optional module(s) not found: ${missingModules.join(", ")}`
  );
}

var token = null;
if (game.user.character == null) {
  token = canvas.tokens.controlled[0];
} else {
  token = game.user.character.getActiveTokens()[0];
}
if (token == null)
  return ui.notifications.error(
    "No viable token found. Not selected on canvas or default assigned to user."
  );
if (token.actor.data.items.find((i) => i.name === featureName) === undefined)
  return ui.notifications.error(
    `Feature not found. Does this character have the ${featureName} feature?`
  );
var classLevels = token.actor.data.items.find((i) => i.name == className)?.data
  ?.levels;
if (classLevels === undefined)
  return ui.notifications.error(
    `${className} class not found. Does this character have a class named ${className}?`
  );

//variable creation
//Set the dice value of the array to according to breakpoints in levelscale
dmgArray[0] = `+${levelScale.filter((x) => x <= classLevels).length}${dmgArray[0]}`;
// Cuter math approach
//dmgArray[0] = `${Math.min(Math.ceil((classLevels+2)/12),2)}${dmgArray[0]}`;
let confirmed = false;
let weaponId = "";
let newContent = `<div class = "form-group">
                    <br>
                    <label>Select Weapon to Attack with  : </label>
                    <select id="weapon" name="Weapon">`;
let weapons = token.actor.items.filter(
  (i) => i.data.data.actionType == "mwak" || i.data.data.actionType == "rwak"
);
weapons.forEach(function (weapon) {
  newContent += `<option value = "${weapon.id}">${weapon.name}</option>`;
});

newContent += `</select></div>`;
//Dialog and Logic
new Dialog({
  title: "Planar Warrior Attack",
  content: newContent,
  buttons: {
    one: {
      icon: `<i class="fas fa-check"></i>`,
      lable: "Continue",
      callback: () => (confirmed = true),
    },
    two: {
      icon: `<i class="fas fa-times"></i>`,
      lable: "Cancel",
      callback: () => (confirmed = false),
    },
  },
  default: "Cancel",
  close: (html) => {
    if (confirmed) {
        weaponId = html.find("[name=Weapon]")[0].value;
      UpdateDamage(token, weaponId);
    }
  },
}).render(true);

function UpdateDamage(token,weaponId) {
  let weapon = token.actor.items.filter((i) => i.id == weaponId)[0];
  const copyWeapon = duplicate(weapon);
  let weaponDamageArray = weapon.data.data.damage.parts[0];

  //character and item update
  copyWeapon.data.damage.parts[0][0] = weaponDamageArray[0] + dmgArray[0];
  copyWeapon.data.damage.parts[0][1] = dmgArray[1];
  token.actor.updateEmbeddedEntity("OwnedItem",copyWeapon);
  
  //Display Information
  MinorQOL.forceRollDamage = true;
  MinorQOL.doRoll(event, weapon.name, {type: "weapon", rollDamage:true});
  //revert weapon
    copyWeapon.data.damage.parts[0] = weaponDamageArray;
    token.actor.updateEmbeddedEntity("OwnedItem",copyWeapon);
}
