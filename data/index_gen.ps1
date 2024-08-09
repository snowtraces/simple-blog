# 设置要遍历的目录路径
$directoryPath = "./post"

# 初始化一个有序的字典来存储日期和文件名
$sortedDateFileMap = [System.Collections.Specialized.OrderedDictionary]::new()

# 获取目录中所有的 .md 文件
$mdFiles = Get-ChildItem -Path $directoryPath -Filter *.md

# 遍历每个 .md 文件
foreach ($file in $mdFiles) {
    # 读取文件内容
    $content = Get-Content -Path $file.FullName

    # 查找第一个匹配的日期格式（例如：date: 2024-08-07）
    $date = $content | Select-String -Pattern 'date:\s*(\d{4}-\d{2}-\d{2})' | ForEach-Object { $_.Matches[0].Groups[1].Value }
    $title = $content | Select-String -Pattern '^title: \s*(.*)' | ForEach-Object { $_.Matches[0].Groups[1].Value }

    # 如果找到日期，将文件名（不含后缀）存储在相应的日期键下
    if ($date) {
        if (-not $sortedDateFileMap.Keys.Contains($date)) {
            $sortedDateFileMap[$date] = @()
        }
        $sortedDateFileMap[$date] += [PSCustomObject]@{
            path = $file.BaseName
            title = $title
        }
    } else {
        Write-Host "未找到日期: $($file.FullName)"
    }
}

# 创建一个新的有序字典，以存储排序后的数据
$finalDateFileMap = [System.Collections.Specialized.OrderedDictionary]::new()

# 按日期逆序排序键，然后对每个日期的文件名数组也进行逆序排序
foreach ($key in ($sortedDateFileMap.Keys | Sort-Object {[datetime]::Parse($_)} -Descending)) {
    $finalDateFileMap[$key] = $sortedDateFileMap[$key]
}

# 将有序的字典转换为 JSON 格式
$jsonOutput = $finalDateFileMap | ConvertTo-Json -Depth 3

# 将 JSON 内容写入到 index.json 文件中
$jsonOutput | Out-File -FilePath "$directoryPath\index.json" -Encoding UTF8