const MAX_FILE_SIZE = 500 * 1024

export async function resize(file){
  // Resize method & size validation
  if (file.size <= MAX_FILE_SIZE){
    console.debug(`file is small enough (${file.size})`)
    return file
  }
  // TODO: resize. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
  return file
}
