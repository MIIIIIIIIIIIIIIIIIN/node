//save the 10 songs in a playlist

// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQAn1JR2aGIZfoh4bK2OnEjZi82-LmrQoEc9UIWPNO1ZbUflvodh3NcULWRPLgvHyw8ypHpZ-OmBCMtI_30VFe_obB-8yeVN3mX1KcUAVcWymXZBRF0__AOgQBd1hRi1QfJYVRz7HtjZHBxCuWiGMceTqlbuKbckmJDWGqw7X2TMJiTFzlDQ4hCMUUPVVV06Z1uMwu5R5LcPSTu5EvIOA1PB0lYiYCAyYaQrD33J8fuczDfgwSuRdwTMqRMJOWH2QL_EkgI12dY';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

const tracksUri = [
  'spotify:track:1NoDTQhJsrd5rnpb6PQthK','spotify:track:053SGPMQCcpqAVG8Rbbwvo','spotify:track:3uIzOtEOBUBXtjEMYfGvXS','spotify:track:5xxe4DGWD4JwakVUwxkCJx','spotify:track:3CgFUlC90UqQWadgmDgujJ','spotify:track:72DMWUqA8F3gdcnMbSy3Q3','spotify:track:5uihiO1z3GJ06tOzjkO0Vb','spotify:track:2P6UP87aTcKxiozVOI5zxO','spotify:track:76dwCdjz1zzooRtfFEbN86','spotify:track:3St6V41VxpoDOYOaGwB6tA'
];

async function createPlaylist(tracksUri){
  const { id: user_id } = await fetchWebApi('v1/me', 'GET')

  const playlist = await fetchWebApi(
    `v1/users/${user_id}/playlists`, 'POST', {
      "name": "My recommendation playlist",
      "description": "Playlist created by the tutorial on developer.spotify.com",
      "public": false
  })

  await fetchWebApi(
    `v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
    'POST'
  );

  return playlist;
}

const createdPlaylist = await createPlaylist(tracksUri);
console.log(createdPlaylist.name, createdPlaylist.id);
