# 设置要遍历的目录路径
$directoryPath = "./post"

# 获取目录中所有的 .md 文件的文件名（不含后缀）
$fileNames = Get-ChildItem -Path $directoryPath -Filter *.md | ForEach-Object { $_.BaseName }

# 按字典序逆序排列文件名数组
$fileNamesSorted = $fileNames | Sort-Object 

# 将数组转换为 JSON 格式
$jsonArray = $fileNamesSorted | ConvertTo-Json

# 将 JSON 内容写入到 index.json 文件中
$jsonArray | Out-File -FilePath "$directoryPath\index.json" -Encoding UTF8
