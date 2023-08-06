#include <iostream>
#include "Stats.h"
#include "Point_Wells.h"
#include "Types.h"
#include "Classes.h"

using namespace std;
/*
void clear_terminal() {
#ifdef ENABLE_ANSI_ESCAPE_CODES
    // ANSI escape code to clear the screen
    std::cout << "\033[2J\033[H";
#else
    // Fallback to using system command for Windows
    // For macOS and Linux, use "clear" command
#ifdef _WIN32
    system("cls");
#else
    system("clear");
    system("clear");
#endif
#endif
}

int main() {
    int selected_class;
    bool is_game_over = false;
    do {
//game screen
        cout << "Select your class:" << endl;
        cout << "1. Knight\n";
        cout << "2. Warrior\n";
        cout << "3. Mage\n";
        cout << "4. Sorcerer\n";
        cout << "5. Cleric\n";
        cout << "6. Rogue\n";
        cout << "7. Peasant\n";
        cout << "8. Trader\n";
        cout << "9. Detailed class info\n";
        cout << "0. Exit\n";
        cin >> selected_class;

        stat_block starting_stats;

        switch (selected_class) {
            case 1:
                starting_stats = knight_class::get_starting_stats();
                break;
            case 2:
                starting_stats = warrior_class::get_starting_stats();
                break;
            case 3:
                starting_stats = mage_class::get_starting_stats();
                break;
            case 4:
                starting_stats = sorcerer_class::get_starting_stats();
                break;
            case 5:
                starting_stats = cleric_class::get_starting_stats();
                break;
            case 6:
                starting_stats = rogue_class::get_starting_stats();
                break;
            case 7:
                starting_stats = peasant_class::get_starting_stats();
                break;
            case 8:
                starting_stats = trader_class::get_starting_stats();
                break;
            case 9:
                int return_to_screen;
                cout << "Knights are walls of armor, absorbing damage and taking hits for their party.\n"
                        "They fight on the front lines, use melee weapons, and rely on abilities not magic.\n\n"
                        "Warriors are frontline damage dealers, getting close and hitting hard.\n"
                        "They are not damage sponges but they can take a hit. They use melee weapons and abilities.\n\n"
                        "Mages are backline damage dealers or support manipulating the physical world to their will.\n"
                        "They cast spells and can specialize in different schools of magic.They are weak of body but strong in mind.\n\n"
                        "Sorcerers are backline damage dealers or support manipulating the non-physical world to theur will\n"
                        "They cast spells and can specialize in different fields of sorcery. They are weak of body but strong in mind.\n\n"
                        "Clerics use divine magic to perform miracles and carry out the will of their deity.\n"
                        "They are backline support but depending on the deity they follow they can perform different miracles.\n\n"
                        "Rogues are stealthy, agile assassins, thieves, and spies. They deal damage then leave the range of engagement.\n"
                        "They use stamina to fuel their abilities and can support their party but in a long drawn out fight they loose it is in their best interests to kill the enemy quickly.\n\n"
                        "Peasants are townspeople who's skills focus on living a quiet life. But when defending their home they can pick up their father's old sword.\n"
                        "They are enduring people used to surviving in the dangerous world of Asteria.They are able to pursue routes of crafting very easily compared to combat focused adventurers.\n\n"
                        "Traders are merchants and business owners. They buy and sell goods and are smooth talkers, able to leverage their charisma to get what they want.\n"
                        "Traders are very good at making money and flipping a profit on items taken from adventures.\n\n"
                        "1. Return to previous screen\n" << endl;
                cin >> return_to_screen;
                clear_terminal();
                cout << "\033[2J\033[H";
                break;
            case 0:
                is_game_over = true;
                break;
            default :
                cout << "Invalid choice. Please choose a valid action.";
                break;

        }
    } while (!is_game_over);
    cout << "Exiting the game. Goodbye!\n";
    return 0;
}
*/