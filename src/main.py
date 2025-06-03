import pygame
import sys
from .car import Car, CAR_WIDTH, CAR_HEIGHT
from .track import Track
from .opponent_car import OpponentCar, OPPONENT_CAR_WIDTH, OPPONENT_CAR_HEIGHT # Import OpponentCar

# Initialize Pygame modules
pygame.init()
pygame.font.init() # Initialize font module

# Screen dimensions
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("F1 Race NES Style")

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 128, 0) # Background color for grass
GREY = (128, 128, 128) # Color for the track
RED = (255, 0, 0)
BLUE = (0, 0, 255)

# Font
UI_FONT_SIZE = 30
TITLE_FONT_SIZE = 50
UI_FONT = pygame.font.SysFont("monospace", UI_FONT_SIZE)
TITLE_FONT = pygame.font.SysFont("monospace", TITLE_FONT_SIZE, bold=True)

# Game States
TITLE_SCREEN = 0
PLAYING = 1
GAME_OVER = 2
current_game_state = TITLE_SCREEN

# --- Store initial positions for reset ---
PLAYER_INITIAL_X, PLAYER_INITIAL_Y = 150, 150 # Near the first checkpoint
OPPONENT_INITIAL_POSITIONS = [] # Will be populated after track is created

# Create game objects (initialization, will be reset in reset_game)
player_car = Car(x=PLAYER_INITIAL_X, y=PLAYER_INITIAL_Y)

# Define simple track points (a closed loop for checkpoints)
# Checkpoints will be created at these vertices by the Track class
track_points = [
    (100, 100), (WIDTH - 100, 100),  # Checkpoint 0 (Start/Finish), Checkpoint 1
    (WIDTH - 100, HEIGHT - 100),    # Checkpoint 2
    (100, HEIGHT - 100)             # Checkpoint 3
]
# Make the track checkpoints fairly large for easier collision
game_track = Track(points=track_points, color=GREY, checkpoint_size=40)

# Adjust start/finish line (checkpoint 0) to be wider, like a line
if game_track.checkpoints:
    start_finish_line = game_track.checkpoints[0]
    # Assuming track point (100,100) is start, make it a horizontal line
    start_finish_line.width = 100 # Width of the line
    start_finish_line.height = 10 # Thickness of the line
    start_finish_line.center = (track_points[0][0], track_points[0][1])

# AI Opponents
ai_path = game_track.get_ai_path() # Should be called once
opponent_cars = [] # Initialize empty, populated in reset_game

# Store initial configurations for opponents to be used in reset_game
# (path is already stored in ai_path)
OPPONENT_CONFIGS = []
if ai_path:
    OPPONENT_CONFIGS.append({'start_x': track_points[1][0] - 50, 'start_y': track_points[1][1], 'speed': 2.2, 'path_index': 1})
    OPPONENT_CONFIGS.append({'start_x': track_points[3][0] + 50, 'start_y': track_points[3][1], 'speed': 2.4, 'path_index': 3})
    # Pre-calculate start positions for opponents based on path if desired
    # For now, using fixed points relative to track_points for simplicity, assuming these points are on/near the ai_path

# Helper function to reset game state
def reset_game():
    global player_car, opponent_cars, game_track, ai_path

    # Reset player car
    player_car.x = PLAYER_INITIAL_X
    player_car.y = PLAYER_INITIAL_Y
    player_car.speed = 0
    player_car.angle = 0 # Default angle (e.g., facing right or up)
    player_car.update_position() # To update rect immediately
    player_car.current_lap = 1
    player_car.lap_times = []
    player_car.last_checkpoint_index = 0 # Start before the first checkpoint (index 0)
    player_car.lap_start_time = pygame.time.get_ticks()

    # Reset opponent cars
    opponent_cars.clear()
    for config in OPPONENT_CONFIGS:
        # Ensure path is valid before creating car
        if not ai_path: continue
        # Find the actual starting node on the path for the opponent
        # For simplicity, let's assume config['path_index'] is a valid index into ai_path
        start_node_index = config.get('path_index',0) % len(ai_path)
        actual_start_x, actual_start_y = ai_path[start_node_index]

        car = OpponentCar(start_x=actual_start_x, # Use path point for precision
                          start_y=actual_start_y,
                          path=ai_path,
                          speed=config['speed'])
        # car.current_path_index = start_node_index # OpponentCar init sets current_path_index to 0 by default
                                                 # If we want them to start at a specific segment, this needs to be set.
                                                 # For now, let them all start targeting path[0] from their spot.
                                                 # Or better, OpponentCar init should take current_path_index
        opponent_cars.append(car)

# Initial reset to setup cars for the first game (or title screen)
reset_game()

# Game loop
clock = pygame.time.Clock()
running = True

def draw_text(text, font, color, surface, x, y, center=False):
    textobj = font.render(text, True, color)
    textrect = textobj.get_rect()
    if center:
        textrect.center = (x, y)
    else:
        textrect.topleft = (x, y)
    surface.blit(textobj, textrect)


while running:
    keys = pygame.key.get_pressed() # Get key state once per frame

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if current_game_state == TITLE_SCREEN:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_RETURN:
                reset_game() # Reset game variables for a fresh start
                current_game_state = PLAYING
        elif current_game_state == PLAYING:
            # (No specific key events here yet, handled by player_car.handle_keyboard_input)
            pass
        elif current_game_state == GAME_OVER:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_r:
                reset_game()
                current_game_state = PLAYING # Or TITLE_SCREEN

    # Game State Logic
    if current_game_state == TITLE_SCREEN:
        screen.fill(GREY) # Or a specific title screen background color
        draw_text("F1 RACER NES STYLE", TITLE_FONT, BLACK, screen, WIDTH / 2, HEIGHT / 3, center=True)
        draw_text("Press ENTER to Start", UI_FONT, BLACK, screen, WIDTH / 2, HEIGHT * 2 / 3, center=True)

    elif current_game_state == PLAYING:
        player_car.handle_keyboard_input(keys)
        player_car.update_position()

        # Lap and checkpoint logic
        num_checkpoints = len(game_track.checkpoints)
        if num_checkpoints > 0:
            next_checkpoint_index = (player_car.last_checkpoint_index + 1) % num_checkpoints
            next_checkpoint_rect = game_track.get_checkpoint(next_checkpoint_index)
            if next_checkpoint_rect and player_car.rect.colliderect(next_checkpoint_rect):
                if next_checkpoint_index == 0 and player_car.last_checkpoint_index == (num_checkpoints - 1):
                    current_time = pygame.time.get_ticks()
                    lap_duration_ms = current_time - player_car.lap_start_time
                    player_car.lap_times.append(lap_duration_ms)
                    player_car.lap_start_time = current_time
                    player_car.current_lap += 1
                    player_car.last_checkpoint_index = 0
                else:
                    player_car.last_checkpoint_index = next_checkpoint_index

        # Update AI Opponents
        for opponent in opponent_cars:
            opponent.update()

        # Collision for Game Over (player car with track boundaries)
        if player_car.check_collision(game_track): # This is the out-of-bounds check
            current_game_state = GAME_OVER
            # Play collision sound?

        # Drawing
        screen.fill(GREEN)
        game_track.draw(screen)
        pygame.draw.rect(screen, WHITE, player_car.rect) # Player car
        for opponent in opponent_cars:
            opponent.draw(screen)

        # Display UI (Lap info)
        lap_text = f"Lap: {player_car.current_lap}"
        draw_text(lap_text, UI_FONT, BLACK, screen, 10, 10)
        if player_car.lap_times:
            last_lap_time_sec = player_car.lap_times[-1] / 1000.0
            last_lap_text = f"Last Lap: {last_lap_time_sec:.2f}s"
            draw_text(last_lap_text, UI_FONT, BLACK, screen, 10, 10 + UI_FONT_SIZE + 5)

    elif current_game_state == GAME_OVER:
        screen.fill(BLACK) # Dark background for game over
        draw_text("GAME OVER", TITLE_FONT, RED, screen, WIDTH / 2, HEIGHT / 3, center=True)
        laps_completed_text = f"Laps Completed: {player_car.current_lap -1}"
        # Handle case where game over happens on lap 1 before any full lap is completed
        if player_car.current_lap == 1 and not player_car.lap_times:
             laps_completed_text = "Laps Completed: 0"
        elif player_car.current_lap > 1 and not player_car.lap_times: # Should not happen if logic is correct
             laps_completed_text = "Laps Completed: 0"


        draw_text(laps_completed_text, UI_FONT, WHITE, screen, WIDTH / 2, HEIGHT / 2, center=True)
        draw_text("Press R to Restart", UI_FONT, WHITE, screen, WIDTH / 2, HEIGHT * 2 / 3, center=True)

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
