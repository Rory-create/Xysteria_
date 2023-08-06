#include "Player_Character.h"
#include "Items.h"
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// Forward declarations
class player_character; // You can include the actual header for player_character here

// Item base class
class Item {
public:
    virtual ~Item() {} // Virtual destructor for proper polymorphic behavior

    virtual std::string getName() const = 0;
    virtual int getQuantity() const = 0;
    virtual std::string getDescription() const = 0;
};

// Derived classes for different types of items
class WeaponItem : public Item {
private:
    string name;
    int quantity;
    string description;

public:
    WeaponItem(string name, int quantity, string description)
            : name(name), quantity(quantity), description(description) {}

    std::string getName() const override {
        return name;
    }

    int getQuantity() const override {
        return quantity;
    }

    std::string getDescription() const override {
        return description;
    }
};

class ArmorItem : public Item {
private:
    string name;
    int quantity;
    string description;

public:
    ArmorItem(string name, int quantity, string description)
            : name(name), quantity(quantity), description(description) {}

    std::string getName() const override {
        return name;
    }

    int getQuantity() const override {
        return quantity;
    }

    std::string getDescription() const override {
        return description;
    }
};

// Inventory class
class Inventory {
private:
    std::vector<Item*> items; // Store pointers to Item objects

public:
    ~Inventory() {
        // Cleanup: Delete dynamically allocated items
        for (Item* item : items) {
            delete item;
        }
    }

    void add_item(Item* item) {
        items.push_back(item);
    }

    void display_inventory() const {
        cout << "Inventory:" << endl;
        cout << "---------------------------------------------------" << endl;
        cout << "| Item Name      | Quantity  | Description        |" << endl;
        cout << "---------------------------------------------------" << endl;
        for (const Item* item : items) {
            cout << "| " << setw(14) << left << item->getName() << " | " << setw(9) << left << item->getQuantity() << " | " << setw(18) << left << item->getDescription() << " |" << endl;
        }
        cout << "---------------------------------------------------" << endl;
        cout << "Total Items: " << items.size() << endl;
    }
};
