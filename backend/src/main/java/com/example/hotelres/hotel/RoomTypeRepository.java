// src/main/java/com/example/hotelres/hotel/RoomTypeRepository.java
package com.example.hotelres.hotel;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

	@Query(value = """
		    SELECT 
		      rt.id                           AS id,
		      rt.name                         AS name,
		      /* 당일가가 없거나 0이면 기본가 사용 */
		      CAST(COALESCE(NULLIF(bd.price,0), rt.price, 0) AS SIGNED) AS price,
		      COALESCE(bd.remaining_qty, 0)   AS todayRemaining
		    FROM room_types rt
		    LEFT JOIN booking_day bd
		      ON bd.room_type_id = rt.id
		     AND bd.stay_date   = CURRENT_DATE()
		    WHERE rt.hotel_id = :hotelId
		    ORDER BY rt.id
		    """, nativeQuery = true)
		List<RoomTypeTodayProjection> findRoomTypesTodayByHotelId(@Param("hotelId") Long hotelId);

    interface RoomTypeTodayProjection {
        Long getId();
        String getName();
        Integer getPrice();
        Integer getTodayRemaining();
    }
}
