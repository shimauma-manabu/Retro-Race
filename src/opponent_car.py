import pygame
import math

OPPONENT_CAR_WIDTH = 20
OPPONENT_CAR_HEIGHT = 30
DEFAULT_OPPONENT_SPEED = 2 # pixels per frame, adjust as needed

class OpponentCar:
    def __init__(self, start_x, start_y, path, speed=DEFAULT_OPPONENT_SPEED):
        self.x = start_x
        self.y = start_y
        self.speed = speed
        self.path = path
        self.current_path_index = 0
        self.rect = pygame.Rect(self.x - OPPONENT_CAR_WIDTH / 2,
                                 self.y - OPPONENT_CAR_HEIGHT / 2,
                                 OPPONENT_CAR_WIDTH, OPPONENT_CAR_HEIGHT)
        self.color = (0, 0, 255) # Blue color for opponent cars

    def update(self):
        if not self.path or self.current_path_index >= len(self.path):
            return # No path or path exhausted

        target_x, target_y = self.path[self.current_path_index]

        dx = target_x - self.x
        dy = target_y - self.y
        distance = math.hypot(dx, dy)

        if distance < self.speed: # Close enough to target
            self.current_path_index += 1
            if self.current_path_index >= len(self.path):
                self.current_path_index = 0 # Loop path
            # Update to next target for this frame if close, helps with sharp turns
            if self.current_path_index < len(self.path):
                 target_x, target_y = self.path[self.current_path_index]
                 dx = target_x - self.x
                 dy = target_y - self.y
                 distance = math.hypot(dx, dy) # Recalculate distance
            else: # Path finished after looping (e.g. path had 1 point)
                 return


        if distance > 0: # Avoid division by zero
            # Normalize direction vector
            norm_dx = dx / distance
            norm_dy = dy / distance

            # Move car
            self.x += norm_dx * self.speed
            self.y += norm_dy * self.speed

        self.rect.center = (self.x, self.y)

    def reset(self, start_x, start_y, path_index=0):
        """Resets the opponent car's position and path progress."""
        self.x = start_x
        self.y = start_y
        self.current_path_index = path_index
        self.rect.center = (self.x, self.y)
        # Speed and path are retained

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, self.rect)

if __name__ == '__main__':
    # Example Usage (requires a Pygame screen)
    pygame.init()
    screen_width, screen_height = 800, 600
    screen = pygame.display.set_mode((screen_width, screen_height))
    pygame.display.set_caption("Opponent Car Test")

    # Define a simple square path
    test_path = [(100, 100), (700, 100), (700, 500), (100, 500)]
    opponent = OpponentCar(start_x=100, start_y=100, path=test_path, speed=3)

    running = True
    clock = pygame.time.Clock()
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        opponent.update()

        screen.fill((200, 200, 200)) # Light grey background
        opponent.draw(screen)
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    print("Opponent car test finished.")
