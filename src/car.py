import math
import pygame # For key constants, Rect, time
from .track import Track # Import Track class, . for relative import

# Car dimensions (adjust as needed)
CAR_WIDTH = 20
CAR_HEIGHT = 30

class Car:
    def __init__(self, x, y, speed=0, acceleration=0.1):
        self.x = x
        self.y = y
        self.speed = speed
        self.acceleration = acceleration
        self.angle = 0  # Initial angle (facing right)
        self.image_path = "assets/images/car.png" # Path to the car's image
        self.engine_sound = "assets/sounds/engine.wav"
        self.brake_sound = "assets/sounds/brake.wav"
        self.collision_sound = "assets/sounds/collision.wav"

        self.rect = pygame.Rect(self.x - CAR_WIDTH / 2, self.y - CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT)

        # Lap tracking attributes
        self.current_lap = 1
        self.lap_times = []
        self.last_checkpoint_index = 0 # Index of the last checkpoint passed
        self.lap_start_time = pygame.time.get_ticks() # Time when current lap started

    def accelerate(self):
        self.speed += self.acceleration

    def brake(self):
        self.speed -= self.acceleration * 2  # Braking is twice as effective as acceleration
        if self.speed < 0:
            self.speed = 0

    def steer_left(self):
        self.angle -= 5  # Degrees

    def steer_right(self):
        self.angle += 5  # Degrees

    def update_position(self):
        # Basic physics, will be improved later
        rad_angle = math.radians(self.angle)
        self.x += self.speed * math.cos(rad_angle)
        self.y -= self.speed * math.sin(rad_angle) # Pygame Y is inverted

        # Update rect position
        self.rect.center = (self.x, self.y)

    def check_collision(self, track):
        """
        Checks if the car has collided with the track boundaries.
        (Placeholder for now)
        :param track: A Track object
        :return: Boolean, True if collision, False otherwise
        """
        # Basic placeholder: check if car is outside a predefined rectangular area
        # This assumes the track is very roughly within a 0-800 x 0-600 area
        if not (0 < self.x < 800 and 0 < self.y < 600):
            print("Collision detected: Car out of bounds!")
            return True
        return False

    # In Car class
    def handle_keyboard_input(self, keys):
        """
        Handles keyboard input for controlling the car.
        :param keys: Dictionary of currently pressed keys (from pygame.key.get_pressed())
        """
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.accelerate()
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.brake()
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.steer_left()
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.steer_right()

# Placeholder functions for keyboard input
# def handle_keyboard_input(car): # This will be removed or refactored into the class
#     # This function will be implemented later to handle keyboard events
#     pass
