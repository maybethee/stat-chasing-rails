class ReplayPresenter
  def initialize(replay)
    @replay = replay
    @replay_stats = @replay.replay_stats.first&.stats
    @blue_team = @replay_stats&.dig('blue', 'players')
    @orange_team = @replay_stats&.dig('orange', 'players')
  end

  def replay_id
    @replay.replay_id
  end

  def winning_team
    @replay.winning_team
  end

  def player_won?(player_name)
    @blue_team.any? { |player| player['name'] == player_name } && @replay.winning_team == 'blue' ? true : false
  end

  def map
    @replay_stats&.dig('map_code')
  end

  def percent_supersonic_speed(player_name)
    # replay_stats = @replay.replay_stats.first&.stats
    # puts "\n\n\n\nthis is happening before anything else!!!!!"
    # puts "\n\nReplay Stats Collection: #{@replay.replay_stats.inspect}"
    # puts "\n\nFirst Replay Stat: #{@replay.replay_stats.first.inspect}"
    # puts "\n\nReplay Stats: #{@replay_stats}"

    # blue_team = @replay_stats&.dig('blue', 'players')
    # orange_team = @replay_stats&.dig('orange', 'players')

    player = find_player(@blue_team, player_name) || find_player(@orange_team, player_name)

    if player
      # puts "\n\nPlayer found: #{player}"
      percent_supersonic_speed = player.dig('stats', 'movement', 'percent_supersonic_speed')
      # puts "\n\nPercent Supersonic Speed: #{percent_supersonic_speed}"
      percent_supersonic_speed || 'No data available'
    else
      puts "\n\n\n\nPlayer not found in replay: #{@replay.replay_id}"
    end
  rescue StandardError => e
    puts "Error accessing percent_supersonic_speed: #{e.message}"
    'Error retrieving data'
  end

  def demos_inflicted(player_name)
    player = find_player(@blue_team, player_name) || find_player(@orange_team, player_name)
    if player
      # puts "\n\nPlayer found: #{player}"
      demos_inflicted = player.dig('stats', 'demo', 'inflicted')
      # puts "\n\nPercent Supersonic Speed: #{percent_supersonic_speed}"
      demos_inflicted || 'No data available'
      # else
      #   puts "\n\n\n\nPlayer not found in replay: #{@replay.replay_id}"
    end
  rescue StandardError => e
    puts "Error accessing percent_supersonic_speed: #{e.message}"
    'Error retrieving data'
  end

  private

  def find_player(team, player_name)
    # puts "\n\n\n\nSearching for player: #{player_name} in #{team}."

    # puts "\n\nteam was nil!!!!!!!!!!!!!!\n\n" if team.nil?
    # puts "\n\n\n\nplayers: \n\n #{team.each { |player| player['name'] }}"
    team&.find { |player| player['name'] == player_name }
    # puts "\n\n\n\nFound player: #{found_player ? found_player['name'] : 'None'}"
  end
end
