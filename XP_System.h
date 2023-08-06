#include <iostream>
#include <cmath>

using namespace std;
/*
class level_system {
    int current_level;
    int exp_points;
    int exp_to_next_level;
    int stat_points;
public:


    // Define your milestones and curve factors here
    const int milestones[41] = {10, 25, 50, 75, 100,125,150,175,200,225, 250,275,300,325,350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975, 1000 };
    const float curve_factors[41] = {1.1f, 1.11f, 1.12f, 1.13f, 1.5, 1.52, 1.54, 1.56, 1.58,1.60, 1.62, 1.64, 2, 2.04, 2.08, 2.12, 2.16, 2.20, 2.24, 2.28, 2.78, 2.84,2.90, 2.96, 3.02, 3.08, 3.14, 3.20, 3.26, 3.32,3.82, 3.90, 3.98, 4.04, 4.12, 4.20, 4.28, 4.36, 4.44, 4.52, 1000000 };

    level_system() : current_level(1), exp_points(0), exp_to_next_level(100), stat_points(0) {}

    int get_stat_points(){
        return stat_points;
    }

    void increase_stat_points(int points){
        stat_points +=points;
    }

    void decrease_stat_points(int points){
        if (stat_points >= points){
            stat_points --;
        }else {
            cout << "Insufficient stat points." << endl;
        }
    }

    void gainExperience(int exp) {
        exp_points += exp;

        // Check for level up
        while (exp_points >= exp_to_next_level) {
            levelUp();
        }
    }

    void levelUp() {
        if (current_level < milestones[0]) {
            exp_to_next_level = 100 * pow(curve_factors[0], current_level - 1);
        } else if (current_level < milestones[1]) {
            exp_to_next_level = 100 * pow(curve_factors[1], current_level - milestones[0]);
        } else if (current_level < milestones[2]) {
            exp_to_next_level = 100 * pow(curve_factors[2], current_level - milestones[1]);
        } else if (current_level < milestones[3]) {
            exp_to_next_level = 100 * pow(curve_factors[3], current_level - milestones[2]);
        } else if (current_level < milestones[4]) {
            exp_to_next_level = 100 * pow(curve_factors[4], current_level - milestones[3]);
        } else if (current_level < milestones[5]) {
            exp_to_next_level = 100 * pow(curve_factors[5], current_level - milestones[4]);
        } else if (current_level < milestones[6]) {
            exp_to_next_level = 100 * pow(curve_factors[6], current_level - milestones[5]);
        } else if (current_level < milestones[7]) {
            exp_to_next_level = 100 * pow(curve_factors[7], current_level - milestones[6]);
        } else if (current_level < milestones[8]) {
            exp_to_next_level = 100 * pow(curve_factors[8], current_level - milestones[7]);
        } else if (current_level < milestones[9]) {
            exp_to_next_level = 100 * pow(curve_factors[9], current_level - milestones[8]);
        } else if (current_level < milestones[10]) {
            exp_to_next_level = 100 * pow(curve_factors[10], current_level - milestones[9]);
        } else if (current_level < milestones[11]) {
            exp_to_next_level = 100 * pow(curve_factors[11], current_level - milestones[10]);
        } else if (current_level < milestones[12]) {
            exp_to_next_level = 100 * pow(curve_factors[12], current_level - milestones[11]);
        } else if (current_level < milestones[13]) {
            exp_to_next_level = 100 * pow(curve_factors[13], current_level - milestones[12]);
        } else if (current_level < milestones[14]) {
            exp_to_next_level = 100 * pow(curve_factors[14], current_level - milestones[13]);
        } else if (current_level < milestones[15]) {
            exp_to_next_level = 100 * pow(curve_factors[15], current_level - milestones[14]);
        } else if (current_level < milestones[16]) {
            exp_to_next_level = 100 * pow(curve_factors[16], current_level - milestones[15]);
        } else if (current_level < milestones[17]) {
            exp_to_next_level = 100 * pow(curve_factors[17], current_level - milestones[16]);
        } else if (current_level < milestones[18]) {
            exp_to_next_level = 100 * pow(curve_factors[18], current_level - milestones[17]);
        } else if (current_level < milestones[19]) {
            exp_to_next_level = 100 * pow(curve_factors[19], current_level - milestones[18]);
        } else if (current_level < milestones[20]) {
            exp_to_next_level = 100 * pow(curve_factors[20], current_level - milestones[19]);
        } else if (current_level < milestones[21]) {
            exp_to_next_level = 100 * pow(curve_factors[21], current_level - milestones[20]);
        } else if (current_level < milestones[22]) {
            exp_to_next_level = 100 * pow(curve_factors[22], current_level - milestones[21]);
        } else if (current_level < milestones[23]) {
            exp_to_next_level = 100 * pow(curve_factors[23], current_level - milestones[22]);
        } else if (current_level < milestones[24]) {
            exp_to_next_level = 100 * pow(curve_factors[24], current_level - milestones[23]);
        } else if (current_level < milestones[25]) {
            exp_to_next_level = 100 * pow(curve_factors[25], current_level - milestones[24]);
        } else if (current_level < milestones[26]) {
            exp_to_next_level = 100 * pow(curve_factors[26], current_level - milestones[25]);
        } else if (current_level < milestones[27]) {
            exp_to_next_level = 100 * pow(curve_factors[27], current_level - milestones[26]);
        } else if (current_level < milestones[28]) {
            exp_to_next_level = 100 * pow(curve_factors[28], current_level - milestones[27]);
        } else if (current_level < milestones[29]) {
            exp_to_next_level = 100 * pow(curve_factors[29], current_level - milestones[28]);
        } else if (current_level < milestones[30]) {
            exp_to_next_level = 100 * pow(curve_factors[30], current_level - milestones[29]);
        } else if (current_level < milestones[31]) {
            exp_to_next_level = 100 * pow(curve_factors[31], current_level - milestones[30]);
        } else if (current_level < milestones[32]) {
            exp_to_next_level = 100 * pow(curve_factors[32], current_level - milestones[31]);
        } else if (current_level < milestones[33]) {
            exp_to_next_level = 100 * pow(curve_factors[33], current_level - milestones[32]);
        } else if (current_level < milestones[34]) {
            exp_to_next_level = 100 * pow(curve_factors[34], current_level - milestones[33]);
        } else if (current_level < milestones[35]) {
            exp_to_next_level = 100 * pow(curve_factors[35], current_level - milestones[34]);
        } else if (current_level < milestones[36]) {
            exp_to_next_level = 100 * pow(curve_factors[36], current_level - milestones[35]);
        } else if (current_level < milestones[37]) {
            exp_to_next_level = 100 * pow(curve_factors[37], current_level - milestones[36]);
        } else if (current_level < milestones[38]) {
            exp_to_next_level = 100 * pow(curve_factors[38], current_level - milestones[37]);
        } else if (current_level < milestones[39]) {
            exp_to_next_level = 100 * pow(curve_factors[39], current_level - milestones[38]);
        }
            // 40th milestone
        else if (current_level < milestones[40]) {
            exp_to_next_level = 100 * pow(curve_factors[40], current_level - milestones[39]);
        }

        exp_points -= exp_to_next_level;
        current_level++;


        cout << "Congratulations! You reached level " << current_level << "!" << endl;
    }

    int get_current_level() const {
        return current_level;
    }

    int get_exp_to_next_level() const {
        return exp_to_next_level;
    }

    int get_exp_points() const {
        return exp_points;
    }
};

*/