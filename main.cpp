#include "Player_Character.h"
#include <iostream>

using namespace std;
player_character::player_character(std::string name) {



    this->Vitality = 0;
    this->Endurance = 0;
    this->Strength = 0;
    this->Agility = 0;
    this->Intellect = 0;
    this->Wisdom = 0;
    this->Charisma = 0;
    this->Faith = 0;

    this->level = 1;
    this->exp_points = 0;
    this->exp_to_next_level = 100;
    this->stat_points = 80;
    this->hp = ((Vitality*10) + (Endurance*5));
    this-> hp_max = ((Vitality*10) + (Endurance*5));
    this-> mp = ((Intellect*10)+(Wisdom*10));
    this->mp = ((Intellect*10)+(Wisdom*10));
    this->sp = ((Endurance*10)+(Agility*5));
    this->sp_max = ((Endurance*10)+(Agility*5));
    this->stat_points = 80;


}

void show_main_menu() {

}

void show_starting_screen() {

    string character_name;

    cout << "Before you adventure begins enter your name: ";
    cin >> character_name;

    player_character player(character_name);
    int selected_class;

    cout << endl << "Welcome to the world of Xysteria, mortal. Your soul was lost in the sands of space and time after your death due to some...\n"
                    " administrative mistakes by the gods... okay me. As recompense you have been given a chance to live again in Xysteria.\n"
                    "Xysteria is a world of magic, sorcery, kings and queens, death and adventure. But most of all, it is home to the system.\n"
                    "The system is the magical framework which governs the world, it gifts mortals the ability to grow, level, and increase their stats.\n"
                    "Now, as a new citizen of Xysteria you will be given a chance to choose your place in the system.\n" << endl;
    cout << "Your first task is to select your class.\n\n"
            "1. Knight - Absorbers of damage and just defenders of the weak.\n"
            "2. Warrior - Frontline damage dealers, they lack brains but make up for that in brawn.\n"
            "3. Mage - Users of magic, the bending and manipulation of the physical world. \n"
            "4. Sorcerer - Users of sorcerer, the bending and manipulation of the non-physical world. \n"
            "5. Cleric - Followers of divine beings they use their faith to perform miracles.\n"
            "6. Rogue - Seducers of shadows they hide from sight and are great thieves, assassins, and hunters. \n"
            "7. Peasant - Townspeople, they find crafting preferable to fighting but can pick up a sword when needed.\n"
            "8. Trader - Merchants, very good at turning a profit on adventurer's goods, they have silver tongues.\n";

    cin >> selected_class;

    if (selected_class == 1) {

        player.increase_vitality(15);
        player.increase_strength(12);
        player.increase_endurance(13);
        player.increase_agility(12);
        player.increase_intellect(7);
        player.increase_wisdom(8);
        player.increase_charisma(8);
        player.increase_faith(8);

        cout << "Congratulations! You have picked the class of Knight!";
    }

    if (selected_class == 2) {

        player.increase_vitality(12);
        player.increase_strength(15);
        player.increase_endurance(14);
        player.increase_agility(11);
        player.increase_intellect(7);
        player.increase_wisdom(7);
        player.increase_charisma(7);
        player.increase_faith(7);

        cout << "Congratulations! You have picked the class of Warrior!";
    }

    if (selected_class == 3) {

        player.increase_vitality(8);
        player.increase_strength(8);
        player.increase_endurance(10);
        player.increase_agility(12);
        player.increase_intellect(15);
        player.increase_wisdom(10);
        player.increase_charisma(8);
        player.increase_faith(9);

        cout << "Congratulations! You have picked the class of Mage!";
    }

    if (selected_class == 4) {

        player.increase_vitality(8);
        player.increase_strength(8);
        player.increase_endurance(10);
        player.increase_agility(12);
        player.increase_intellect(10);
        player.increase_wisdom(15);
        player.increase_charisma(8);
        player.increase_faith(9);

        cout << "Congratulations! You have picked the class of Sorcerer!";
    }

    if (selected_class == 5) {

        player.increase_vitality(10);
        player.increase_strength(8);
        player.increase_endurance(10);
        player.increase_agility(10);
        player.increase_intellect(7);
        player.increase_wisdom(10);
        player.increase_charisma(8);
        player.increase_faith(15);

        cout << "Congratulations! You have picked the class of Cleric!";
    }

    if (selected_class == 6) {

        player.increase_vitality(10);
        player.increase_strength(9);
        player.increase_endurance(14);
        player.increase_agility(15);
        player.increase_intellect(7);
        player.increase_wisdom(7);
        player.increase_charisma(12);
        player.increase_faith(6);

        cout << "Congratulations! You have picked the class of Rogue!";
    }

    if (selected_class == 7) {

        player.increase_vitality(9);
        player.increase_strength(13);
        player.increase_endurance(15);
        player.increase_agility(8);
        player.increase_intellect(10);
        player.increase_wisdom(6);
        player.increase_charisma(7);
        player.increase_faith(12);

        cout << "Congratulations! You have picked the class of Peasant!";
    }

    if (selected_class == 8) {

        player.increase_vitality(11);
        player.increase_strength(6);
        player.increase_endurance(11);
        player.increase_agility(7);
        player.increase_intellect(10);
        player.increase_wisdom(13);
        player.increase_charisma(15);
        player.increase_faith(7);

        cout << "Congratulations! You have picked the class of Trader!";
    }

}


int main() {

    bool is_game_over = true;

    while (is_game_over) {

    }
    cout << "Thank you for playing my game! Goodbye!\n";
    return 0;
}