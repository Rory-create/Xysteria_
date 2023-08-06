#pragma once
#include <iostream>

using namespace std;

class player_character {
protected:
    //core
    string name;
    int level;
    int exp_points;
    int exp_to_next_level;
    int stat_points;
    int hp;
    int hp_max;
    int mp;
    int mp_max;
    int sp;
    int sp_max;

    //stats
    uint32_t Vitality;
    uint32_t Endurance;
    uint32_t Strength;
    uint32_t Agility;
    uint32_t Intellect;
    uint32_t Wisdom;
    uint32_t Charisma;
    uint32_t Faith;

public:

    const int milestones[41] = {10, 25, 50, 75, 100,125,150,175,200,225, 250,275,300,325,350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975, 1000 };
    const float curve_factors[41] = {1.1f, 1.11f, 1.12f, 1.13f, 1.5, 1.52, 1.54, 1.56, 1.58,1.60, 1.62, 1.64, 2, 2.04, 2.08, 2.12, 2.16, 2.20, 2.24, 2.28, 2.78, 2.84,2.90, 2.96, 3.02, 3.08, 3.14, 3.20, 3.26, 3.32,3.82, 3.90, 3.98, 4.04, 4.12, 4.20, 4.28, 4.36, 4.44, 4.52, 1000000 };

    void levelUp() {
        if (level < milestones[0]) {
            exp_to_next_level = 100 * pow(curve_factors[0], level - 1);
        } else if (level < milestones[1]) {
            exp_to_next_level = 100 * pow(curve_factors[1], level - milestones[0]);
        } else if (level < milestones[2]) {
            exp_to_next_level = 100 * pow(curve_factors[2], level - milestones[1]);
        } else if (level < milestones[3]) {
            exp_to_next_level = 100 * pow(curve_factors[3], level - milestones[2]);
        } else if (level < milestones[4]) {
            exp_to_next_level = 100 * pow(curve_factors[4], level - milestones[3]);
        } else if (level < milestones[5]) {
            exp_to_next_level = 100 * pow(curve_factors[5], level - milestones[4]);
        } else if (level < milestones[6]) {
            exp_to_next_level = 100 * pow(curve_factors[6], level - milestones[5]);
        } else if (level < milestones[7]) {
            exp_to_next_level = 100 * pow(curve_factors[7], level - milestones[6]);
        } else if (level < milestones[8]) {
            exp_to_next_level = 100 * pow(curve_factors[8], level - milestones[7]);
        } else if (level < milestones[9]) {
            exp_to_next_level = 100 * pow(curve_factors[9], level - milestones[8]);
        } else if (level < milestones[10]) {
            exp_to_next_level = 100 * pow(curve_factors[10], level - milestones[9]);
        } else if (level < milestones[11]) {
            exp_to_next_level = 100 * pow(curve_factors[11], level - milestones[10]);
        } else if (level < milestones[12]) {
            exp_to_next_level = 100 * pow(curve_factors[12], level - milestones[11]);
        } else if (level < milestones[13]) {
            exp_to_next_level = 100 * pow(curve_factors[13], level - milestones[12]);
        } else if (level < milestones[14]) {
            exp_to_next_level = 100 * pow(curve_factors[14], level - milestones[13]);
        } else if (level < milestones[15]) {
            exp_to_next_level = 100 * pow(curve_factors[15], level - milestones[14]);
        } else if (level < milestones[16]) {
            exp_to_next_level = 100 * pow(curve_factors[16], level - milestones[15]);
        } else if (level < milestones[17]) {
            exp_to_next_level = 100 * pow(curve_factors[17], level - milestones[16]);
        } else if (level < milestones[18]) {
            exp_to_next_level = 100 * pow(curve_factors[18], level - milestones[17]);
        } else if (level < milestones[19]) {
            exp_to_next_level = 100 * pow(curve_factors[19], level - milestones[18]);
        } else if (level < milestones[20]) {
            exp_to_next_level = 100 * pow(curve_factors[20], level - milestones[19]);
        } else if (level < milestones[21]) {
            exp_to_next_level = 100 * pow(curve_factors[21], level - milestones[20]);
        } else if (level < milestones[22]) {
            exp_to_next_level = 100 * pow(curve_factors[22], level - milestones[21]);
        } else if (level < milestones[23]) {
            exp_to_next_level = 100 * pow(curve_factors[23], level - milestones[22]);
        } else if (level < milestones[24]) {
            exp_to_next_level = 100 * pow(curve_factors[24], level - milestones[23]);
        } else if (level < milestones[25]) {
            exp_to_next_level = 100 * pow(curve_factors[25], level - milestones[24]);
        } else if (level < milestones[26]) {
            exp_to_next_level = 100 * pow(curve_factors[26], level - milestones[25]);
        } else if (level < milestones[27]) {
            exp_to_next_level = 100 * pow(curve_factors[27], level - milestones[26]);
        } else if (level < milestones[28]) {
            exp_to_next_level = 100 * pow(curve_factors[28], level - milestones[27]);
        } else if (level < milestones[29]) {
            exp_to_next_level = 100 * pow(curve_factors[29], level - milestones[28]);
        } else if (level < milestones[30]) {
            exp_to_next_level = 100 * pow(curve_factors[30], level - milestones[29]);
        } else if (level < milestones[31]) {
            exp_to_next_level = 100 * pow(curve_factors[31], level - milestones[30]);
        } else if (level < milestones[32]) {
            exp_to_next_level = 100 * pow(curve_factors[32], level - milestones[31]);
        } else if (level < milestones[33]) {
            exp_to_next_level = 100 * pow(curve_factors[33], level - milestones[32]);
        } else if (level < milestones[34]) {
            exp_to_next_level = 100 * pow(curve_factors[34], level - milestones[33]);
        } else if (level < milestones[35]) {
            exp_to_next_level = 100 * pow(curve_factors[35], level - milestones[34]);
        } else if (level < milestones[36]) {
            exp_to_next_level = 100 * pow(curve_factors[36], level - milestones[35]);
        } else if (level < milestones[37]) {
            exp_to_next_level = 100 * pow(curve_factors[37], level - milestones[36]);
        } else if (level < milestones[38]) {
            exp_to_next_level = 100 * pow(curve_factors[38], level - milestones[37]);
        } else if (level < milestones[39]) {
            exp_to_next_level = 100 * pow(curve_factors[39], level - milestones[38]);
        }
            // 40th milestone
        else if (level < milestones[40]) {
            exp_to_next_level = 100 * pow(curve_factors[40], level - milestones[39]);
        }

        exp_points -= exp_to_next_level;
        level++;
        stat_points += 5;
    }

    int get_current_level() const {
        return level;
    }

    int get_exp_to_next_level() const {
        return exp_to_next_level;
    }

    int get_exp_points() const {
        return exp_points;
    }


    player_character(string name);

    void increase_vitality(int amt) {
        Vitality += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_vitality() {
        return Vitality;
    }

    void increase_endurance(int amt) {
        Endurance += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_endurance() {
        return Endurance;
    }

    void increase_strength(int amt) {
        Strength += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_strength() {
        return Strength;
    }

    void increase_agility(int amt) {
        Agility += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_agility() {
        return Agility;
    }

    void increase_intellect(int amt) {
        Intellect += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_intellect() {
        return Intellect;
    }

    void increase_wisdom(int amt) {
        Wisdom += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_wisdom() {
        return Wisdom;
    }

    void increase_charisma(int amt) {
        Charisma += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_charisma() {
        return Charisma;
    }

    void increase_faith(int amt) {
        Faith += amt;
        if (stat_points >= amt) {
            stat_points -= amt;
        } else {
            cout << "Insufficient stat points\n";
        }
    }

    int get_faith() {
        return Faith;
    }

    void update_hp(){
        hp = hp;
        hp_max = ((Vitality*10)+(Endurance*5));
    }

    void heal(int heal_amt) {
        hp += heal_amt;
        if (heal_amt >= hp_max) {
            hp = hp_max;
            return;
        }
    }

    void damage(int damage_amt) {
        hp -= damage_amt;
        if (damage_amt >= hp){
            hp = 0;
            return;
        }
    }

    int get_hp(){
        return hp;
    }

    int get_hp_max() {
        return hp_max;
    }

    void update_mp(){
        mp = mp;
        mp_max = ((Intellect*10)+(Wisdom*10));
    }

    void mp_increase(int mp_amt) {
        hp += mp_amt;
        if (mp_amt >= hp_max) {
            hp = hp_max;
            return;
        }
    }

    void mp_use(int use_amt) {
        hp -= use_amt;
        if (use_amt >= hp){
            hp = 0;
            return;
        }
    }

    int get_mp(){
        return mp;
    }

    int get_mp_max() {
        return mp_max;
    }

    void update_sp(){
        sp = sp;
        sp_max = ((Endurance*10)+(Agility*5));
    }

    void regen_stamina(int stam_amt) {
        hp += stam_amt;
        if (stam_amt >= hp_max) {
            hp = hp_max;
            return;
        }
    }

    void use_stamina(int stam_use_amt) {
        hp -= stam_use_amt;
        if (stam_use_amt >= hp){
            hp = 0;
            return;
        }
    }

    int get_sp(){
        return sp;
    }

    int get_sp_max() {
        return sp_max;
    }

    string get_name() {
        return name;
    }

};