// src/main/java/com/example/hotelres/hotel/HotelController.java
package com.example.hotelres.hotel;

import com.example.hotelres.hotel.dto.FeaturedHotelDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotels") // ← 클래스 레벨 prefix
@RequiredArgsConstructor
public class HotelController {

    private final HotelService hotelService;

    // 1) 호텔ID로 호출하는 버전: GET /api/hotels/2/featured
    @GetMapping("/{hotelId}/featured")
    public FeaturedHotelDto featured(@PathVariable Long hotelId) {
        return hotelService.getHotelWithRoomTypes(hotelId);
    }

    // 2) (선택) 2번 호텔로 고정하는 버전: GET /api/hotels/featured
    @GetMapping("/featured")
    public FeaturedHotelDto featuredFixed() {
        return hotelService.getHotelWithRoomTypes(2L);
    }
}
