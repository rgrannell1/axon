
import yaml
import glob

def is_match(fpath, id):
  with open(fpath) as conn:
    content = conn.read()

    return id in content

def import_old_note(fpath):
  with open("/home/rg/Drive/Obsidian/" + fpath) as conn:
    lines = conn.readlines()
    print(lines)

def main():
  pass
  # read bookmark declarations
  # if url in file, copy base file name and content and create in folder
  # else add to new list

  old_files = glob.glob("/home/rg/Drive/Obsidian/*.md")

  with open('/home/rg/Drive/Axon/TMP.yml') as conn:
    docs = yaml.full_load(conn)

    unlisted = []

    for item in docs:
      matches = [fpath for fpath in old_files if is_match(fpath, item['id'])]

      if len(matches) == 0:
        unlisted.append(item)
      if len(matches) == 1:
        match = str.split(matches[0], ' - ', 1)
        import_old_note(match[1])
      else:
        unlisted.append(item)

  with open('unlisted.yaml', 'w') as conn:
    yaml.dump(unlisted, conn)

main()
