/**
 * http://usejsdoc.org/
 */
module.exports = function(value) {

	var wdloc = this.helpers.getWdioLocator(locator);
	if (this.autoWait) {
		this.waitForVisible(locator);
	}
switch (value) {
	case "Unidentified":
		value = "\uE000";
		break;
	case "Cancel":
		value = "\uE001";
		break;
	case "Help":
		value = "\uE002";
		break;
	case "Backspace":
		value = "\uE003";
		break;
	case "Tab":
		value = "\uE004";
		break;
	case "Clear":
		value = "\uE005";
		break;
	case "Return":
		value = "\uE006";
		break;
    case "Enter":
		value = "\uE007";
		break;
	case "Shift":
		value = "\uE008";
		break;
	case "Control":
		value = "\uE009";
		break;
	case "Alt":
		value = "\uE00A";
		break;
	case "Pause":
		value = "\uE00B";
		break;
	case "Escape":
		value = "\uE00C";
		break;
	case "PageUp":
		value = "\uE00E";
		break;
	case "PageDown":
		value = "\uE00F";
		break;
	case "End":
		value = "\uE010";
		break;
	case "Home":
		value = "\uE011";
		break;
	case "ArrowLeft":
		value = "\uE012";
		break;
	case "ArrowUp":
		value = "\uE013";
		break;
	case "ArrowRight":
		value = "\uE014";
		break;
	case "ArrowDown":
		value = "\uE015";
		break;
	case "Insert":
		value = "\uE016";
		break;
	case "Delete":
		value = "\uE017";
		break;
	case "F1":
		value = "\uE031";
		break;
	case "F2":
		value = "\uE032";
		break;
	case "F3":
		value = "\uE033";
		break;
	case "F4":
		value = "\uE034";
		break;
	case "F5":
		value = "\uE035";
		break;
	case "F6":
		value = "\uE036";
		break;
	case "F7":
		value = "\uE037";
		break;
	case "F8":
		value = "\uE038";
		break;
	case "F9":
		value = "\uE039";
		break;
	case "F10":
		value = "\uE03A";
		break;
	case "F11":
		value = "\uE03B";
		break;
	case "F12":
		value = "\uE03C";
		break;
	default:
		break;
	}

	return this.driver.keys(value);
};