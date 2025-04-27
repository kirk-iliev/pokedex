import './App.css';
import { useState, useEffect } from 'react';

// Components ----------------------------------------------------------------------------------------------------

function SearchInput({ inputValue, setInputValue, setShowSuggestions }) {
  return (
    <input
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        setShowSuggestions(true); // ← RE-ENABLE suggestions on typing
      }}
      onFocus={() => setShowSuggestions(true)}
      onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // slight delay
    />
  );
}

function SearchButton({ searchPokemon, inputValue }) {
  return (
    <button
      className="search-button"
      onClick={() => searchPokemon(inputValue)}
    >
      Search Pokémon
    </button>
  );
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Main App ------------------------------------------------------------------------------------------------------
export default function PokeDex() {
  // State variables
  const [inputValue, setInputValue] = useState('');
  const [pokemonData, setPokemonData] = useState(null);
  const [pokemonList, setPokemonList] = useState([]);
  const [damageRelations, setDamageRelations] = useState({});
  const suggestions = pokemonList.filter(pokemon => pokemon.name.startsWith(inputValue.toLowerCase()));
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    fetchPokemonList();
  }, []);

  // Fetch the list of all Pokémon
  function fetchPokemonList() {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
      .then((response) => response.json())
      .then((data) => {
        setPokemonList(data.results);
      })
      .catch((error) => {
        console.error('Error fetching Pokemon list:', error);
      });
  }

  function searchPokemon(name = inputValue) {
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then((response) => response.json())
      .then((data) => {
        setPokemonData(data);
        fetchDamageRelations(data.types);
      })
      .catch((error) => {
        console.error('Error fetching Pokemon data:', error);
      });
  }

  function fetchDamageRelations(types) {
    const promises = types.map((type) =>
      fetch(type.type.url)
        .then((response) => response.json())
        .then((data) => ({ [type.type.name]: data.damage_relations }))
    );

    Promise.all(promises).then((results) => {
      const relations = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setDamageRelations(relations);
    });
  }

  function handleSuggestionClick(name) {
    const capitalizedName = capitalizeFirstLetter(name);
    setInputValue(capitalizedName);
    searchPokemon(capitalizedName);
    setShowSuggestions(false);
  }

  return (
    <div className='app-container'>
      <h1>Pokédex</h1>
      <div className="input-container">
        <SearchInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          setShowSuggestions={setShowSuggestions}
        />
        {inputValue.length > 0 && suggestions.length > 0 && showSuggestions && (
          <div className="suggestions-dropdown">
            {suggestions.map((s, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(s.name)}
              >
                {capitalizeFirstLetter(s.name)}
              </div>
            ))}
          </div>
        )}
      </div>
      <SearchButton searchPokemon={searchPokemon} inputValue={inputValue} />

      {pokemonData && (
        <div style={{ textAlign: 'center' }}>
          <h2>
            {capitalizeFirstLetter(pokemonData.name)}{' '}
            <span style={{ color: 'gray', fontWeight: 'normal' }}>#{pokemonData.id}</span>
          </h2>
          <table className="pokemon-info-table">
            <tbody>
              <tr>
                <td colSpan="2">
                  <img src={pokemonData.sprites.front_default} alt={pokemonData.name} />
                </td>
              </tr>
              <tr>
                <td>Type: </td>
                <td>{pokemonData.types.map(t => capitalizeFirstLetter(t.type.name)).join(', ')}</td>
              </tr>
              <tr>
                <td>Height: </td>
                <td>{pokemonData.height / 10} m</td>
              </tr>
              <tr>
                <td>Weight: </td>
                <td>{pokemonData.weight / 10} kg</td>
              </tr>
              <tr>
                <td>Abilities: </td>
                <td>{pokemonData.abilities.map(a => capitalizeFirstLetter(a.ability.name)).join(', ')}</td>
              </tr>
              <tr>
                <td>Stats: </td>
                <td>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {pokemonData.stats.map((stat) => (
                        <tr key={stat.stat.name}>
                          <td style={{ textAlign: 'left', padding: '4px', fontWeight: 'bold' }}>
                            {capitalizeFirstLetter(stat.stat.name)}
                          </td>
                          <td style={{ textAlign: 'right', padding: '4px' }}>
                            {stat.base_stat}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td>Strong Against: </td>
                <td>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {pokemonData.types.map((type) => (
                        <tr key={type.type.name}>
                          <td style={{ textAlign: 'left', padding: '4px', fontWeight: 'bold' }}>
                            {capitalizeFirstLetter(type.type.name)}
                          </td>
                          <td style={{ textAlign: 'right', padding: '4px' }}>
                            {damageRelations[type.type.name]?.double_damage_to
                              .map((t) => capitalizeFirstLetter(t.name))
                              .join(', ') || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td>Weak Against: </td>
                <td>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {pokemonData.types.map((type) => (
                        <tr key={type.type.name}>
                          <td style={{ textAlign: 'left', padding: '4px', fontWeight: 'bold' }}>
                            {capitalizeFirstLetter(type.type.name)}
                          </td>
                          <td style={{ textAlign: 'right', padding: '4px' }}>
                            {damageRelations[type.type.name]?.double_damage_from
                              .map((t) => capitalizeFirstLetter(t.name))
                              .join(', ') || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
