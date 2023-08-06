#pragma once
#include <iostream>
#include "Stats.h"
#include "Point_Wells.h"
#include "Types.h"

using namespace std;

class knight_class {
public:
    static stat_block get_starting_stats(){
        stat_block stats(12, 7, 13, 8, 15, 9, 8, 8);
        return stats;
    }
};

class warrior_class {
public:
static stat_block get_starting_stats(){
    stat_block stats(15, 7, 14, 7, 12, 11, 7, 7);
    return stats;
}
};

class mage_class {
public:
    static stat_block get_starting_stats() {
        stat_block stats(8, 15, 10, 8, 8, 12, 10, 9);
        return stats;
    }
};

class sorcerer_class {
public:
    static stat_block get_starting_stats() {
        stat_block stats(8, 10, 10, 8, 8, 12, 15, 9);
        return stats;
    }
};

class cleric_class {
public:
    static stat_block get_starting_stats() {
        stat_block stats(8, 7, 10, 8, 10, 10, 12, 15);
        return stats;
    }
};

class rogue_class {
public:
    static stat_block get_starting_stats() {
        stat_block stats(9, 7, 14, 12, 10, 15, 7, 6);
        return stats;
    }
};

class peasant_class {
public:
    static stat_block get_starting_stats() {
        stat_block stats(13, 10, 15, 7, 9, 8, 6, 12);
        return stats;
    }
};

class trader_class {
public:
    static stat_block get_starting_stats() {
        stat_block stats(6, 9, 12, 15, 11, 7, 13, 7);
        return stats;
    }
};