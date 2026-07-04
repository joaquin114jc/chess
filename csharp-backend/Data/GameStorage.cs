using ChessBackend.Models;
using System.Collections.Concurrent;
using System.Text.Json;

namespace ChessBackend.Data
{
    public class GameStorage
    {
        private readonly string _dataPath;
        private readonly ConcurrentDictionary<string, object> _games = new();

        public GameStorage(IWebHostEnvironment env)
        {
            _dataPath = Path.Combine(env.ContentRootPath, "saved_games.json");
            LoadFromDisk();
        }

        public IEnumerable<string> GetGameNames() => _games.Keys.OrderBy(name => name);

        public GameState? LoadGame(string name)
        {
            if (_games.TryGetValue(name, out var state))
            {
                return new GameState { Name = name, State = state };
            }
            return null;
        }

        public void SaveGame(string name, object? state)
        {
            if (state is null) return;
            _games[name] = state;
            PersistToDisk();
        }

        public bool DeleteGame(string name)
        {
            var removed = _games.TryRemove(name, out _);
            if (removed) PersistToDisk();
            return removed;
        }

        private void LoadFromDisk()
        {
            if (!File.Exists(_dataPath)) return;
            try
            {
                var json = File.ReadAllText(_dataPath);
                var games = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
                if (games is not null)
                {
                    foreach (var kvp in games)
                    {
                        _games[kvp.Key] = kvp.Value ?? new { };
                    }
                }
            }
            catch
            {
                // Ignore deserialization errors.
            }
        }

        private void PersistToDisk()
        {
            var snapshot = _games.ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            var json = JsonSerializer.Serialize(snapshot, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_dataPath, json);
        }
    }
}
