import unittest
import pygame
import math
from src.car import Car, CAR_WIDTH, CAR_HEIGHT # Assuming src is in PYTHONPATH or accessible

class TestCarMovement(unittest.TestCase):

    # @classmethod
    # def setUpClass(cls):
    #     # Initialize Pygame once for all tests in this class
    #     # Important if any class relies on pygame.init for loading resources, etc.
    #     # For Car class, it uses pygame.Rect and pygame.time.get_ticks()
    #     # pygame.init() # TRYING WITHOUT THIS
    #     pass

    def setUp(self):
        """Set up for each test method."""
        # Initial position and angle for the car
        self.start_x = 100
        self.start_y = 100
        self.start_angle = 0 # Facing right
        self.car = Car(x=self.start_x, y=self.start_y)
        self.car.angle = self.start_angle # Explicitly set angle if not done by constructor option

    def test_initial_attributes(self):
        self.assertEqual(self.car.x, self.start_x)
        self.assertEqual(self.car.y, self.start_y)
        self.assertEqual(self.car.angle, self.start_angle)
        self.assertEqual(self.car.speed, 0)
        self.assertIsNotNone(self.car.rect)
        self.assertEqual(self.car.rect.center, (self.start_x, self.start_y))
        self.assertEqual(self.car.current_lap, 1)
        self.assertEqual(self.car.lap_times, [])
        self.assertEqual(self.car.last_checkpoint_index, 0)
        self.assertGreaterEqual(pygame.time.get_ticks(), self.car.lap_start_time)


    def test_accelerate(self):
        initial_speed = self.car.speed
        self.car.accelerate()
        self.assertGreater(self.car.speed, initial_speed)
        # Check against a specific value if acceleration amount is known
        # self.assertEqual(self.car.speed, initial_speed + self.car.acceleration)

    def test_brake_reduces_speed(self):
        self.car.speed = 5  # Set a positive speed
        initial_speed = self.car.speed
        self.car.brake()
        self.assertLess(self.car.speed, initial_speed)
        # self.assertEqual(self.car.speed, initial_speed - self.car.acceleration * 2)


    def test_brake_does_not_go_below_zero(self):
        self.car.speed = 0.05 # A very small speed, less than double acceleration
        self.car.brake()
        self.assertEqual(self.car.speed, 0)
        self.car.brake() # Brake again at zero speed
        self.assertEqual(self.car.speed, 0)


    def test_steer_left(self):
        initial_angle = self.car.angle
        self.car.steer_left()
        # Angle should decrease (or wrap around if handling 360 degrees)
        self.assertEqual(self.car.angle, initial_angle - 5)

    def test_steer_right(self):
        initial_angle = self.car.angle
        self.car.steer_right()
        # Angle should increase (or wrap around)
        self.assertEqual(self.car.angle, initial_angle + 5)

    def test_update_position_no_movement_at_zero_speed(self):
        self.car.speed = 0
        self.car.update_position()
        self.assertEqual(self.car.x, self.start_x)
        self.assertEqual(self.car.y, self.start_y)
        self.assertEqual(self.car.rect.center, (self.start_x, self.start_y))

    def test_update_position_horizontal_movement(self):
        self.car.speed = 10
        self.car.angle = 0  # Facing right
        self.car.update_position()
        expected_x = self.start_x + 10
        expected_y = self.start_y # No vertical movement as sin(0) = 0
        self.assertAlmostEqual(self.car.x, expected_x)
        self.assertAlmostEqual(self.car.y, expected_y)
        self.assertEqual(self.car.rect.center, (round(expected_x), round(expected_y)))

    def test_update_position_vertical_movement(self):
        self.car.speed = 10
        self.car.angle = 90  # Facing "up" in math terms (negative Y in Pygame)
        self.car.update_position()
        expected_x = self.start_x # No horizontal movement as cos(90) = 0
        expected_y = self.start_y - 10 # Negative because Y is inverted and sin(90)=1
        self.assertAlmostEqual(self.car.x, expected_x)
        self.assertAlmostEqual(self.car.y, expected_y)
        self.assertEqual(self.car.rect.center, (round(expected_x), round(expected_y)))

    def test_update_position_diagonal_movement(self):
        self.car.speed = 10
        self.car.angle = 45 # Diagonal
        self.car.update_position()
        # cos(45) = sin(45) = sqrt(2)/2 approx 0.7071
        move_delta = 10 * math.cos(math.radians(45))
        expected_x = self.start_x + move_delta
        expected_y = self.start_y - move_delta # Y inverted

        self.assertAlmostEqual(self.car.x, expected_x)
        self.assertAlmostEqual(self.car.y, expected_y)
        self.assertEqual(self.car.rect.center, (round(expected_x), round(expected_y)))

    def test_update_position_rect_updates(self):
        initial_rect_center = self.car.rect.center
        self.car.speed = 1
        self.car.update_position()
        self.assertNotEqual(self.car.rect.center, initial_rect_center)
        self.assertEqual(self.car.rect.center, (round(self.car.x), round(self.car.y)))

if __name__ == '__main__':
    unittest.main()
