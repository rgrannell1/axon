

# filter things with the 'is' concept supplied
axon.jq.is () {
  local concept="$1"
  jq ". | select(has(\"is\")) | select(.is[] | . == \"$concept\")"
}

# filter for things with a given id
axon.jq.has_id () {
  local id="$1"
  jq ". | select(has(\"id\")) | select(.id == \"$id\")"
}

# alias of has id
axon.jq.has_src () {
  local id="$1"
  jq ". | select(has(\"id\")) | select(.id == \"$id\")"
}

# filter for things where a relationship exists
axon.jq.has_rel () {
  local rel="$1"
  jq ". | select(has(\"$rel\"))"
}

# filter for things with a given target at any relationship position
axon.jq.has_tgt () {
  local tgt="$1"
  jq "select(. | values[] | if type==\"array\" then (.[] | . == \"$tgt\") else . == \"$tgt\" end)"
}
