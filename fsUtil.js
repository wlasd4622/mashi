let fs = require('fs')
let path = require('path')
/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getStat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    })
  })
}

/**
* 创建路径
* @param {string} dir 路径
*/
function mkdir(dir) {
  return new Promise((resolve, reject) => {
    try {
      if (path.basename(dir) && path.basename(dir).includes('.')) {
        fs.writeFileSync(dir, '');
        resolve(true)
        return true
      }
    } catch (err) {
      console.log(err);
    }
    fs.mkdir(dir, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    })
  })
}

/**
* 路径是否存在，不存在则创建
* @param {string} dir 路径
*/
async function dirExists(dir) {
  let isExists = await getStat(dir);
  //如果该路径且不是文件，返回true
  if (isExists && isExists.isDirectory()) {
    return true;
  } else if (isExists) {     //如果该路径存在但是文件，返回false
    return false;
  }
  //如果该路径不存在
  let tempDir = path.parse(dir).dir;      //拿到上级路径
  //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  let status = await dirExists(tempDir);
  let mkdirStatus;
  if (status) {
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
}


function delDir(p) {
  // 读取文件夹中所有文件及文件夹
  var list = fs.readdirSync(p)
  list.forEach((v, i) => {
    // 拼接路径
    var url = p + '/' + v
    // 读取文件信息
    var stats = fs.statSync(url)
    // 判断是文件还是文件夹
    if (stats.isFile()) {
      // 当前为文件，则删除文件
      fs.unlinkSync(url)
    } else {
      // 当前为文件夹，则递归调用自身
      arguments.callee(url)
    }
  })
  // 删除空文件夹
  fs.rmdirSync(p)
}

module.exports = {
  dirExists,
  delDir
}
