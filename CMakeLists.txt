cmake_minimum_required(VERSION 3.25)
project(uPlanned_RPG)

set(CMAKE_CXX_STANDARD 23)

# Add all the necessary source files to the executable target
add_executable(uPlanned_RPG
        main.cpp
        XP_System.h  Player_Character.h opening_screen.cpp Items.h Inventory.h)
