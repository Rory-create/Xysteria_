#include <iostream>
#include <string>
#include "Player_Character.h"

using namespace std;

enum class equipment_slot {
    head,
    chest,
    legs,
    hands,
    feet,
    main_hand,
    off_hand,
    neck,
    ring1,
    ring2

};

enum class strength_tier {
    F,
    E,
    D,
    C,
    B,
    A,
    S,
    SS,
    SSS
};

enum class rarity_tier {
    Basic,
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Mythical
};

enum class item_type {
    h_potion,
    m_potion,
    food,
    single_use_weapon // New item type for single-use weapons
};

class Armor {
private:
    std::string name;
    equipment_slot slot;
    int armor_points;
    int durability;
    strength_tier strength;
    rarity_tier rarity;

public:
    Armor(std::string name, equipment_slot slot, int armor_points, int durability, strength_tier strength, rarity_tier rarity)
            : name(name), slot(slot), armor_points(armor_points), durability(durability), strength(strength), rarity(rarity) {}

    // Getter methods
    std::string get_name() const { return name; }
    equipment_slot get_slot() const { return slot; }
    int get_armor_points() const { return armor_points; }
    int get_durability() const { return durability; }
    strength_tier get_strength_tier() const { return strength; }
    rarity_tier get_rarity_tier() const { return rarity; }
};

class Weapon {
private:
    string name;
    equipment_slot slot;
    int base_damage;
    int durability;
    strength_tier strength;
    rarity_tier rarity;
    float agility_scaling_factor;
    float strength_scaling_factor;
    float intellect_scaling_factor;
    float wisdom_scaling_factor;
    float faith_scaling_factor;

public:
    Weapon(string name, equipment_slot slot, int base_damage, int durability,
           strength_tier strength, rarity_tier rarity, float agility_scaling_factor,
           float strength_scaling_factor, float intellect_scaling_factor,
           float wisdom_scaling_factor, float faith_scaling_factor)
        : name(name),
        slot(slot),
        base_damage(base_damage),
        durability(durability),
        strength(strength),
        rarity(rarity),
        intellect_scaling_factor(intellect_scaling_factor),
        agility_scaling_factor(agility_scaling_factor),
        strength_scaling_factor(strength_scaling_factor),
        wisdom_scaling_factor(wisdom_scaling_factor),
        faith_scaling_factor(faith_scaling_factor){}

    string get_name() const {return name;}
    equipment_slot get_slot() const {return slot;}
    int get_base_damage() const {return base_damage;}
    int get_durability() const {return durability;}
    strength_tier get_strength_tier() const {return strength;}
    rarity_tier get_rarity_tier() const {return rarity;}

    int calculate_total_damage(player_character player) const {
        int scaling_damage = static_cast<int>((player.get_strength()) * strength_scaling_factor +
                                            (player.get_agility()) * agility_scaling_factor +
                                            (player.get_wisdom()) * wisdom_scaling_factor +
                                            (player.get_intellect()) * intellect_scaling_factor +
                                            (player.get_faith()) * faith_scaling_factor);
        int total_damage = base_damage + scaling_damage;
    }

};

class Usable_Item {
private:
    std::string name;
    item_type type;
    int healing_amount; // Amount of healing the item provides
    int mana_restore;   // Amount of mana restoration the item provides
    int weapon_damage;  // Damage the weapon deals to enemies (for single-use weapons)

public:
    Usable_Item(std::string name, item_type type, int healing_amount, int mana_restore, int weapon_damage = 0)
            : name(name), type(type), healing_amount(healing_amount), mana_restore(mana_restore), weapon_damage(weapon_damage) {}

    void use_item(player_character& player) {
        if (type == item_type::h_potion) {
            player.heal(healing_amount);
            std::cout << player.get_name() << " used " << name << ". It healed " << healing_amount << " HP." << std::endl;
        } else if (type == item_type::food) {
            player.regen_stamina(healing_amount);
            std::cout << player.get_name() << " ate " << name << ". It restored " << healing_amount << " stamina." << std::endl;
        }
            // If the item is an MP potion, restore the player's MP
        else if (type == item_type::m_potion && mana_restore > 0) {
            player.mp_increase(mana_restore);
            std::cout << player.get_name() << " used " << name << ". It restored " << mana_restore << " MP." << std::endl;
        } else if (type == item_type::single_use_weapon) {
            // Assuming the player can damage enemies in this example
            std::cout << player.get_name() << " used " << name << ". It dealt " << weapon_damage << " damage to the enemy." << std::endl;
            // Apply damage to the enemy here (implementation not included in this example)
        }
    }

    int get_healing_amount(){
        return healing_amount;
    }

    int get_mana_restore(){
        return mana_restore;
    }

    int get_weapon_damage(){
        return weapon_damage;
    }

    std::string get_name() const {
        return name;
    }

    item_type get_type() const {
        return type;
    }
};