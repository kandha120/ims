package IMS.Controller;

import IMS.Entity.UnitOfMeasurement;
import IMS.Service.UnitOfMeasurementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@CrossOrigin(origins = "*")
public class UnitOfMeasurementController {

    @Autowired
    private UnitOfMeasurementService service;

    @GetMapping
    public ResponseEntity<List<UnitOfMeasurement>> getAllUnits() {
        return ResponseEntity.ok(service.getAllUnits());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UnitOfMeasurement> getUnitById(@PathVariable Long id) {
        UnitOfMeasurement unit = service.getUnitById(id);
        if (unit == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(unit);
    }

    @PostMapping
    public ResponseEntity<UnitOfMeasurement> addUnit(@RequestBody UnitOfMeasurement unit) {
        return ResponseEntity.ok(service.saveUnit(unit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnitOfMeasurement> updateUnit(@PathVariable Long id, @RequestBody UnitOfMeasurement unit) {
        UnitOfMeasurement updated = service.updateUnit(id, unit);
        if (updated == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long id) {
        if (service.deleteUnit(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
