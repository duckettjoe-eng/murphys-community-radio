export const spotifyPlaylistMap: Record<string, string | null> = {
  "Golden Hour Groove":
    "https://open.spotify.com/embed/playlist/4ri1ZAjCFIKrRiVPetRQ9o",
  "Dusty Crate Hip-Hop Hour":
    "https://open.spotify.com/embed/playlist/31SuOU4Vbv7xjdtYlW4PE1",
  "Cali Sun Reggae Ride":
    "https://open.spotify.com/embed/playlist/52zUoTdo4OqEWuKlLKCFGQ",
  "Alt-Rock Barroom Radio":
    "https://open.spotify.com/embed/playlist/6KkMn1xcEFXvVSZCKFFybL",
  "Weird Late-Night FM":
    "https://open.spotify.com/embed/playlist/5ODp9PktHOlGvWD3K9S7lI",
  "House Party Frequency": null,
  "Lowrider Soul Sunday":
    "https://open.spotify.com/embed/playlist/5CCMUgfKsjRRFa3MoKYLhI",
  "Campfire Americana":
    "https://open.spotify.com/embed/playlist/3x9ZBPysWWve6yO4LhgBCl",
  "Mashup Crate Hour": null,
  "Skull County Garage Gospel":
    "https://open.spotify.com/embed/playlist/5AV4VUbcgU9LT9TA6pEoVG",
};

export function getSpotifyEmbedUrl(showName: string) {
  return spotifyPlaylistMap[showName] || null;
}

export function getSpotifyOpenUrl(showName: string) {
  return getSpotifyEmbedUrl(showName)?.replace("/embed", "") || null;
}
