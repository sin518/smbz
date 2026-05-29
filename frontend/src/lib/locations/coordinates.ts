export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  precision: "district" | "city";
}

const cityCoordinates: Record<string, Omit<LocationCoordinate, "precision">> = {
  "北京市 北京市": { latitude: 39.9042, longitude: 116.4074 },
  "天津市 天津市": { latitude: 39.3434, longitude: 117.3616 },
  "上海市 上海市": { latitude: 31.2304, longitude: 121.4737 },
  "重庆市 重庆市": { latitude: 29.563, longitude: 106.5516 },
  "河北省 石家庄市": { latitude: 38.0428, longitude: 114.5149 },
  "山西省 太原市": { latitude: 37.8706, longitude: 112.5489 },
  "内蒙古自治区 呼和浩特市": { latitude: 40.8426, longitude: 111.7492 },
  "辽宁省 沈阳市": { latitude: 41.8057, longitude: 123.4315 },
  "吉林省 长春市": { latitude: 43.8171, longitude: 125.3235 },
  "黑龙江省 哈尔滨市": { latitude: 45.8038, longitude: 126.5349 },
  "江苏省 南京市": { latitude: 32.0603, longitude: 118.7969 },
  "浙江省 杭州市": { latitude: 30.2741, longitude: 120.1551 },
  "安徽省 合肥市": { latitude: 31.8206, longitude: 117.2272 },
  "福建省 福州市": { latitude: 26.0745, longitude: 119.2965 },
  "江西省 南昌市": { latitude: 28.6829, longitude: 115.8582 },
  "山东省 济南市": { latitude: 36.6512, longitude: 117.1201 },
  "河南省 郑州市": { latitude: 34.7466, longitude: 113.6254 },
  "湖北省 武汉市": { latitude: 30.5928, longitude: 114.3055 },
  "湖南省 长沙市": { latitude: 28.2282, longitude: 112.9388 },
  "广东省 广州市": { latitude: 23.1291, longitude: 113.2644 },
  "广东省 佛山市": { latitude: 23.0215, longitude: 113.1214 },
  "广东省 梅州市": { latitude: 24.2886, longitude: 116.1225 },
  "广西壮族自治区 南宁市": { latitude: 22.817, longitude: 108.3669 },
  "海南省 海口市": { latitude: 20.044, longitude: 110.1999 },
  "四川省 成都市": { latitude: 30.5728, longitude: 104.0668 },
  "贵州省 贵阳市": { latitude: 26.647, longitude: 106.6302 },
  "云南省 昆明市": { latitude: 25.0389, longitude: 102.7183 },
  "西藏自治区 拉萨市": { latitude: 29.652, longitude: 91.1721 },
  "陕西省 西安市": { latitude: 34.3416, longitude: 108.9398 },
  "甘肃省 兰州市": { latitude: 36.0611, longitude: 103.8343 },
  "青海省 西宁市": { latitude: 36.6171, longitude: 101.7782 },
  "宁夏回族自治区 银川市": { latitude: 38.4872, longitude: 106.2309 },
  "新疆维吾尔自治区 乌鲁木齐市": { latitude: 43.8256, longitude: 87.6168 },
  "香港特别行政区 香港特别行政区": { latitude: 22.3193, longitude: 114.1694 },
  "澳门特别行政区 澳门特别行政区": { latitude: 22.1987, longitude: 113.5439 },
  "台湾省 台北市": { latitude: 25.033, longitude: 121.5654 }
};

const districtCoordinates: Record<string, Omit<LocationCoordinate, "precision">> = {
  "广东省 佛山市 南海区": { latitude: 23.0288, longitude: 113.1428 },
  "广东省 梅州市 大埔县": { latitude: 24.3478, longitude: 116.6948 }
};

export function getChinaLocationCoordinate(province: string, city: string, district: string): LocationCoordinate | null {
  const districtCoordinate = districtCoordinates[`${province} ${city} ${district}`];

  if (districtCoordinate) {
    return {
      ...districtCoordinate,
      precision: "district"
    };
  }

  const cityCoordinate = cityCoordinates[`${province} ${city}`];

  if (cityCoordinate) {
    return {
      ...cityCoordinate,
      precision: "city"
    };
  }

  // TODO: 接入许可证明确的离线区县坐标库后，优先返回区县级行政中心坐标。
  return null;
}
