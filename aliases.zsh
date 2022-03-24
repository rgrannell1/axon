
# filter things with the 'is' concept supplied
axon.is () {
  local concept="$1"
  jq ". | select(has(\"is\")) | select(.is[] | . == \"$concept\")"
}

axon.has_id () {
  local id="$1"
  jq ". | select(has(\"id\")) | select(.id == \"$id\")"
}

axon.has_src () {
  local id="$1"
  jq ". | select(has(\"id\")) | select(.id == \"$id\")"
}

axon.has_rel () {
  local rel="$1"
  jq ". | select(has(\"$rel\"))"
}

axon.has_tgt () {
  local tgt="$1"
  jq "select(. | values[] | if type==\"array\" then (.[] | . == \"$tgt\") else . == \"$tgt\" end)"
}
