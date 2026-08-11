package IMS.Service;

import IMS.Entity.UnitOfMeasurement;
import IMS.Repos.UnitOfMeasurementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UnitOfMeasurementService {

    @Autowired
    private UnitOfMeasurementRepository repo;

    public List<UnitOfMeasurement> getAllUnits() {
        return repo.findAll();
    }

    public UnitOfMeasurement getUnitById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public UnitOfMeasurement saveUnit(UnitOfMeasurement unit) {
        return repo.save(unit);
    }

    public UnitOfMeasurement updateUnit(Long id, UnitOfMeasurement unit) {
        UnitOfMeasurement existing = repo.findById(id).orElse(null);
        if (existing == null)
            return null;

        existing.setUnit(unit.getUnit());
        existing.setStatus(unit.getStatus());

        return repo.save(existing);
    }

    public boolean deleteUnit(Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }
}
