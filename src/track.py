import pygame # For drawing, Rect

class Track:
    def __init__(self, points, width=80, color=(128, 128, 128), checkpoint_size=20):
        """
        Initializes the track with a list of points defining its centerline.
        Points can be a list of (x, y) tuples.
        width: width of the track.
        color: color of the track.
        checkpoint_size: size of the checkpoint rectangles.
        """
        self.points = points
        self.width = width
        self.color = color
        self.checkpoints = []
        self.checkpoint_size = checkpoint_size

        self._create_checkpoints()

    def _create_checkpoints(self):
        """
        Creates checkpoint rectangles. For now, centered on the vertices of the track.
        The first checkpoint is the start/finish line.
        """
        if not self.points:
            return

        for i, point in enumerate(self.points):
            # Create a rect centered at each point.
            # For the start/finish line (checkpoint 0), it might need to be wider or oriented differently
            # For simplicity, all checkpoints are squares for now.
            cp_rect = pygame.Rect(
                point[0] - self.checkpoint_size / 2,
                point[1] - self.checkpoint_size / 2,
                self.checkpoint_size,
                self.checkpoint_size
            )
            self.checkpoints.append(cp_rect)
            # Mark the first checkpoint as the start/finish line (e.g., by convention or an attribute)
            # For now, index 0 is implicitly the start/finish line.

    def get_checkpoint(self, index):
        """Returns the checkpoint rect at the given index, if valid."""
        if 0 <= index < len(self.checkpoints):
            return self.checkpoints[index]
        return None

    def draw(self, screen):
        """
        Draws the track on the given Pygame screen.
        """
        if len(self.points) < 2:
            return # Not enough points to draw

        # Draw the track as a series of thick lines (or a polygon)
        # For a closed track, Pygame's polygon is suitable.
        # If it's an open track or needs more complex rendering (like individual segments),
        # pygame.draw.lines might be better, or custom line drawing.
        pygame.draw.polygon(screen, self.color, self.points, 0) # Filled polygon for the track surface

        # To draw a border or centerline, you could use:
        # pygame.draw.lines(screen, (0,0,0), True, self.points, 5) # True for closed loop

        # For debugging, draw checkpoints
        # for i, cp in enumerate(self.checkpoints):
        #     color = (255, 0, 0) if i == 0 else (0, 0, 255) # Red for start/finish, blue for others
        #     pygame.draw.rect(screen, color, cp, 2)

    def get_ai_path(self, offset_from_centerline=0):
        """
        Generates a list of (x,y) coordinates for the AI path.
        For now, it returns the track's defining points (vertices).
        The offset_from_centerline is not used yet but is a placeholder for future refinement.
        """
        # Simple path: use the track points themselves.
        # Future improvements could calculate a smoother centerline or offset paths.
        if not self.points:
            return []

        # Ensure path loops by appending the first point if it's not already the same as the last
        path = list(self.points) # Create a mutable copy
        if path and path[0] != path[-1]:
             # This check is more for open paths; for polygons self.points usually don't repeat the start.
             # For a race track, we want it to loop, so the OpponentCar will handle looping its index.
             pass # Path looping is handled by OpponentCar's current_path_index logic.

        return path


if __name__ == '__main__':
    # Example usage (requires Pygame to be initialized and a screen):
    pygame.init()
    screen_width, screen_height = 800, 600
    screen = pygame.display.set_mode((screen_width, screen_height))
    pygame.display.set_caption("Track Test")

    track_points_example = [
        (100, 100), (700, 100), # Checkpoint 0 (Start/Finish) and 1
        (700, 500), (100, 500)  # Checkpoint 2 and 3
    ]
    # Make the start/finish line checkpoint wider for easier collision
    sample_track = Track(points=track_points_example, color=(100, 100, 100), checkpoint_size=30)
    # Specifically, make checkpoint 0 wider (e.g. across the track)
    if sample_track.checkpoints:
        start_finish_line = sample_track.checkpoints[0]
        start_finish_line.width = sample_track.width # Make it as wide as the track
        start_finish_line.x = sample_track.points[0][0] - sample_track.width / 2 # Adjust x if centered on point before

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        screen.fill((0, 128, 0))  # Green background
        sample_track.draw(screen)
        # Example: draw checkpoints for visualization in test
        for i, cp in enumerate(sample_track.checkpoints):
            cp_color = (255, 0, 0) if i == 0 else (0, 0, 255)
            pygame.draw.rect(screen, cp_color, cp, 1) # Draw as outline

        pygame.display.flip()

    pygame.quit()
    print("Track drawing example finished.")
